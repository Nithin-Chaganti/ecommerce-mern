import React, { useState, useEffect } from 'react';
import { Store, BarChart3, PackageOpen, Truck, Settings, Plus, Edit2, Trash2, ShieldCheck, Clock, ShieldAlert, ArrowUpRight, ClipboardList, MapPin, Loader2, Check } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Skeleton from '../../components/common/Skeleton';
import Modal from '../../components/common/Modal';
import ProductModal from '../../components/seller/ProductModal';
import { useToast } from '../../context/ToastContext';

const SellerDashboard = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('analytics'); // analytics | inventory | fulfillment
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Profile onboarding states
  const [profile, setProfile] = useState(null);
  const [submittingOnboarding, setSubmittingOnboarding] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({
    storeName: '',
    storeDescription: '',
    gstin: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    verificationDocumentUrl: ''
  });

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [statusUpdatingItemId, setStatusUpdatingItemId] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get('/seller/profile');
      const currentProfile = profileRes.data.data;
      setProfile(currentProfile);

      // Pre-fill onboarding form inputs
      setOnboardingForm({
        storeName: currentProfile.storeName || '',
        storeDescription: currentProfile.storeDescription || '',
        gstin: currentProfile.gstin || '',
        street: currentProfile.businessAddress?.street || '',
        city: currentProfile.businessAddress?.city || '',
        state: currentProfile.businessAddress?.state || '',
        pincode: currentProfile.businessAddress?.pincode || '',
        verificationDocumentUrl: currentProfile.verificationDocumentUrl || ''
      });

      if (currentProfile.approvalStatus === 'approved') {
        const [analyticsRes, productsRes, ordersRes] = await Promise.all([
          api.get('/seller/analytics'),
          api.get('/products/mine/list?limit=100'),
          api.get('/seller/orders?limit=100')
        ]);
        setAnalytics(analyticsRes.data.data);
        setProducts(productsRes.data.data.products || []);
        setOrders(ordersRes.data.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      showToast('Error fetching dashboard statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    if (!onboardingForm.storeName || !onboardingForm.gstin || !onboardingForm.verificationDocumentUrl) {
      showToast('Store name, GSTIN, and Verification Document are required.', 'warning');
      return;
    }

    setSubmittingOnboarding(true);
    try {
      const payload = {
        storeName: onboardingForm.storeName,
        storeDescription: onboardingForm.storeDescription,
        gstin: onboardingForm.gstin,
        businessAddress: {
          street: onboardingForm.street,
          city: onboardingForm.city,
          state: onboardingForm.state,
          pincode: onboardingForm.pincode
        },
        verificationDocumentUrl: onboardingForm.verificationDocumentUrl
      };

      const response = await api.patch('/seller/profile', payload);
      setProfile(response.data.data);
      showToast('Verification documents submitted successfully!', 'success');
    } catch (err) {
      console.error('Verification submission failed:', err);
      showToast(err.response?.data?.message || 'Verification submission failed.', 'error');
    } finally {
      setSubmittingOnboarding(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setDocumentUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await api.post('/uploads/seller-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setOnboardingForm((prev) => ({
        ...prev,
        verificationDocumentUrl: response.data.data.documentUrl
      }));
      showToast('Document uploaded successfully!', 'success');
    } catch (err) {
      console.error('Document upload failed:', err);
      showToast('Failed to upload document file.', 'error');
    } finally {
      setDocumentUploading(false);
    }
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete._id}`);
      showToast('Product listing deleted successfully!', 'success');
      setProducts((prev) => prev.filter((p) => p._id !== productToDelete._id));
      setProductToDelete(null);
      // Refresh analytics totals
      const analyticsRes = await api.get('/seller/analytics');
      setAnalytics(analyticsRes.data.data);
    } catch (err) {
      console.error('Failed to delete product:', err);
      showToast(err.response?.data?.message || 'Failed to delete product.', 'error');
    }
  };

  const handleItemStatusUpdate = async (orderId, itemId, newStatus) => {
    setStatusUpdatingItemId(itemId);
    try {
      await api.patch(`/seller/orders/${orderId}/items/${itemId}/status`, { status: newStatus });
      showToast(`Item status updated to ${newStatus}!`, 'success');
      
      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order._id === orderId) {
            return {
              ...order,
              items: order.items.map((item) =>
                item._id === itemId ? { ...item, itemStatus: newStatus } : item
              )
            };
          }
          return order;
        })
      );
    } catch (err) {
      console.error('Fulfillment status update failed:', err);
      showToast(err.response?.data?.message || 'Fulfillment status update failed.', 'error');
    } finally {
      setStatusUpdatingItemId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'pending':
      case 'processing':
      case 'shipped':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'rejected':
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  // Group last 7 days of sales for chart
  const getSalesChartData = () => {
    const data = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      data[label] = 0;
    }

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      if (data[orderDate] !== undefined) {
        const sellerItemsSum = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        data[orderDate] += sellerItemsSum;
      }
    });

    return Object.entries(data).map(([label, value]) => ({ label, value }));
  };

  const chartData = getSalesChartData();
  const maxVal = Math.max(...chartData.map((d) => d.value), 100);

  if (loading && !profile) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Guard for onboarding application approvals
  // ---------------------------------------------------------------------------
  if (profile && profile.approvalStatus !== 'approved') {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-8 font-sans">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Store size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900">Seller Onboarding</h1>
            <p className="text-xs text-slate-400">Complete your verification details to begin selling on ApexMarket.</p>
          </div>
        </div>

        {profile.approvalStatus === 'pending' && profile.gstin ? (
          /* Verification Pending Card */
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <Clock size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">Application Under Review</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Thank you for submitting your verification details for store <strong className="text-indigo-600 font-bold">{profile.storeName}</strong>. Our moderators are reviewing your tax information and uploaded documents.
              </p>
            </div>
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 max-w-sm mx-auto text-left text-xs space-y-1.5">
              <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Submitted Details</p>
              <p className="font-semibold text-slate-800">Store: {profile.storeName}</p>
              <p className="font-semibold text-slate-800">GSTIN: {profile.gstin}</p>
              {profile.verificationDocumentUrl && (
                <a href={profile.verificationDocumentUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline block font-bold mt-1">
                  View Uploaded Certificate →
                </a>
              )}
            </div>
          </div>
        ) : (
          /* Onboarding Form */
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            {profile.approvalStatus === 'rejected' && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 flex gap-3 text-xs">
                <ShieldAlert className="shrink-0 text-rose-500 font-semibold" size={16} />
                <div>
                  <p className="font-bold">Application Verification Rejected</p>
                  <p className="mt-0.5 text-rose-600 leading-relaxed font-semibold">Reason: {profile.rejectionReason || 'Incomplete details'}</p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Business Verification Form</h2>
              <p className="text-[11px] text-slate-400">Please provide a valid Indian GSTIN and identification documents.</p>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Store Display Name"
                  placeholder="e.g. Apex Electronics"
                  value={onboardingForm.storeName}
                  onChange={(e) => setOnboardingForm(prev => ({ ...prev, storeName: e.target.value }))}
                  required
                />
                <Input
                  label="GSTIN (15 Alphanumeric Characters)"
                  placeholder="e.g. 22AAAAA1111A1Z1"
                  maxLength={15}
                  value={onboardingForm.gstin}
                  onChange={(e) => setOnboardingForm(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                  required
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Store Description"
                    placeholder="Briefly tell buyers about your shop offerings..."
                    value={onboardingForm.storeDescription}
                    onChange={(e) => setOnboardingForm(prev => ({ ...prev, storeDescription: e.target.value }))}
                  />
                </div>

                <div className="sm:col-span-2 border-t border-slate-50 pt-4 mt-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Business Address</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Street Address"
                      value={onboardingForm.street}
                      onChange={(e) => setOnboardingForm(prev => ({ ...prev, street: e.target.value }))}
                    />
                    <Input
                      label="City"
                      value={onboardingForm.city}
                      onChange={(e) => setOnboardingForm(prev => ({ ...prev, city: e.target.value }))}
                    />
                    <Input
                      label="State"
                      value={onboardingForm.state}
                      onChange={(e) => setOnboardingForm(prev => ({ ...prev, state: e.target.value }))}
                    />
                    <Input
                      label="Pincode"
                      value={onboardingForm.pincode}
                      onChange={(e) => setOnboardingForm(prev => ({ ...prev, pincode: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 border-t border-slate-50 pt-4 mt-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-500">GST Certificate / ID Proof Document (PDF or Image)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleDocumentUpload}
                      disabled={documentUploading}
                      className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    {documentUploading && <Loader2 className="animate-spin text-indigo-600" size={16} />}
                  </div>
                  {onboardingForm.verificationDocumentUrl && (
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Check size={12} /> Document uploaded successfully. Ready to submit!
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" variant="primary" loading={submittingOnboarding}>
                  Submit Application
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-8 font-sans">
      
      {/* Dashboard Title header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Store size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900">Seller Dashboard</h1>
            <p className="text-xs text-slate-400">Manage store listings, check sales metrics, and fulfill orders.</p>
          </div>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleAddClick}>
          Add New Product
        </Button>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-100 gap-6">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <BarChart3 size={18} />
          <span>Sales & Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'inventory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <PackageOpen size={18} />
          <span>Product Inventory ({products.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('fulfillment')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'fulfillment' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Truck size={18} />
          <span>Order Fulfillment ({orders.length})</span>
        </button>
      </div>

      {/* Content Panels */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-8 animate-fade-in">
          {/* Summary stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Revenue card */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Sales Revenue</span>
                <h3 className="text-2xl font-extrabold text-slate-800 mt-1">₹{analytics.totalRevenue}</h3>
              </div>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full self-start font-bold flex items-center gap-0.5">
                <ArrowUpRight size={10} /> +12.4% increase
              </span>
            </div>

            {/* Items Sold card */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Units Sold</span>
                <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{analytics.totalItemsSold} items</h3>
              </div>
              <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full self-start font-bold">
                Lifetime fulfillment
              </span>
            </div>

            {/* Approved Products */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Catalog Products</span>
                <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{analytics.approvedProducts} items</h3>
              </div>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500" /> Publicly browsable
              </span>
            </div>

            {/* Pending Products */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pending Moderation</span>
                <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{analytics.pendingProducts} items</h3>
              </div>
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full self-start font-bold flex items-center gap-1">
                <Clock size={10} /> Awaiting approval
              </span>
            </div>

          </div>

          {/* SVG Sales Chart Section */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">Weekly Sales Chart</h3>
              <p className="text-[11px] text-slate-400">Total revenue generated per day over the last 7 days.</p>
            </div>
            
            <div className="w-full flex items-center justify-center pt-2">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 font-semibold">
                  No weekly sales statistics available currently.
                </div>
              ) : (
                <div className="w-full max-w-2xl h-60 flex flex-col justify-between">
                  <svg className="w-full h-44" viewBox="0 0 500 170">
                    {/* Vertical grid lines & bars */}
                    {chartData.map((d, i) => {
                      const barWidth = 26;
                      const xPos = 40 + i * 65;
                      const chartHeight = 120;
                      const barHeight = maxVal > 0 ? (d.value / maxVal) * chartHeight : 0;
                      const yPos = 140 - barHeight;

                      return (
                        <g key={i} className="group">
                          {/* Grid line */}
                          <line x1={xPos + barWidth / 2} y1="10" x2={xPos + barWidth / 2} y2="140" stroke="#f8fafc" strokeWidth="1.5" />
                          
                          {/* Bar */}
                          <rect
                            x={xPos}
                            y={yPos}
                            width={barWidth}
                            height={barHeight}
                            rx="5"
                            fill="#6366f1"
                            className="transition-all duration-300 hover:fill-indigo-700 cursor-pointer"
                          />
                          
                          {/* Value label displayed on hover */}
                          <text
                            x={xPos + barWidth / 2}
                            y={yPos - 6}
                            textAnchor="middle"
                            className="text-[9px] font-bold fill-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ₹{d.value}
                          </text>
                          
                          {/* X axis labels */}
                          <text x={xPos + barWidth / 2} y="155" textAnchor="middle" className="text-[10px] font-bold fill-slate-400">
                            {d.label}
                          </text>
                        </g>
                      );
                    })}
                    
                    {/* X Axis horizontal base line */}
                    <line x1="20" y1="140" x2="480" y2="140" stroke="#f1f5f9" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Quick summary lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Recent Catalog Additions</h3>
              <div className="divide-y divide-slate-50 text-xs">
                {products.slice(0, 4).map((p) => (
                  <div key={p._id} className="py-3 flex justify-between items-center gap-2">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt={p.title} className="w-10 h-10 object-cover rounded-lg border border-slate-100 bg-slate-50 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800 truncate max-w-[200px]">{p.title}</p>
                        <p className="text-[10px] text-slate-400">Stock: {p.stock} units</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full capitalize ${getStatusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Recent Sales Orders</h3>
              <div className="divide-y divide-slate-50 text-xs">
                {orders.slice(0, 4).map((o) => (
                  <div key={o._id} className="py-3 flex justify-between items-center gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">Order ID: <span className="font-mono text-slate-500">{o._id.substring(16)}</span></p>
                      <p className="text-[10px] text-slate-400">Date: {new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-slate-800">₹{o.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden animate-fade-in">
          {products.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <PackageOpen className="mx-auto text-slate-300" size={48} />
              <p className="text-sm font-semibold text-slate-500">No products uploaded yet</p>
              <Button variant="primary" onClick={handleAddClick}>Create First Product</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Product Details</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Price</th>
                    <th className="py-4 px-6">Stock</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-50">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3 min-w-[240px]">
                        <img src={p.images[0]} alt={p.title} className="w-12 h-12 object-cover rounded-xl border border-slate-100 bg-slate-50 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate max-w-[200px]">{p.title}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {p.category?.name || 'Uncategorized'}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        ₹{p.price}
                        {p.discountPercent > 0 && (
                          <span className="text-[10px] text-emerald-600 block">-{p.discountPercent}% off</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {p.stock} units
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full capitalize ${getStatusBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-all bg-white"
                          title="Edit Product"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-rose-500 hover:text-rose-600 transition-all bg-white"
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'fulfillment' && (
        <div className="space-y-6 animate-fade-in">
          {orders.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-20 text-center space-y-4">
              <ClipboardList className="mx-auto text-slate-300" size={48} />
              <p className="text-sm font-semibold text-slate-500">No customer orders received yet</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order._id} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden p-6 space-y-6">
                
                {/* Header detail */}
                <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-50/70 border-b border-slate-50 p-4 -m-6 mb-4">
                  <div className="text-xs text-slate-500 font-semibold">
                    <span>Order: <span className="font-mono text-slate-700">{order._id}</span></span>
                    <span className="mx-2">•</span>
                    <span>Date: <span className="text-slate-700">{new Date(order.createdAt).toLocaleDateString()}</span></span>
                  </div>
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full capitalize">
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                {/* Shipping Delivery Detail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-slate-50 pb-4">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1"><MapPin size={12} /> Shipping Address</p>
                    <p className="font-semibold text-slate-800">{order.shippingAddress.fullName}</p>
                    <p className="text-slate-500">{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Contact Phone</p>
                    <p className="font-mono text-slate-700">{order.shippingAddress.phone}</p>
                  </div>
                </div>

                {/* Items loop */}
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item._id} className="flex justify-between items-center gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.title} className="w-10 h-10 object-cover rounded-lg border border-slate-100 bg-slate-50 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800">{item.title}</p>
                          <p className="text-[10px] text-slate-400">Quantity: {item.quantity} | Price: ₹{item.price}</p>
                        </div>
                      </div>
                      
                      {/* Dropdown status changer */}
                      <div className="flex items-center gap-2">
                        {statusUpdatingItemId === item._id ? (
                          <Loader2 className="animate-spin text-indigo-600" size={16} />
                        ) : (
                          <select
                            value={item.itemStatus}
                            onChange={(e) => handleItemStatusUpdate(order._id, item._id, e.target.value)}
                            disabled={['cancelled', 'delivered'].includes(item.itemStatus) || order.orderStatus === 'cancelled'}
                            className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-slate-700 focus:outline-none focus:border-indigo-500 text-[10px] font-bold cursor-pointer"
                          >
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                        <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full capitalize select-none ${getStatusBadge(item.itemStatus)}`}>
                          {item.itemStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reusable dialog product modal */}
      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          productToEdit={selectedProduct}
          onSaveSuccess={fetchDashboardData}
        />
      )}

      {/* Reusable Delete verification modal */}
      {productToDelete && (
        <Modal
          isOpen={!!productToDelete}
          onClose={() => setProductToDelete(null)}
          title="Delete Product Listing"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-500 leading-relaxed font-semibold">
              Are you sure you want to permanently delete product <strong className="text-slate-800">{productToDelete.title}</strong>? This action is irreversible.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setProductToDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteConfirm}>Delete listing</Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default SellerDashboard;
