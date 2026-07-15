
import React, { useState, useEffect } from 'react';
import { Store, BarChart3, PackageOpen, Truck, Settings, Plus, Edit2, Trash2, ShieldCheck, Clock, ShieldAlert, ArrowUpRight, ClipboardList, MapPin } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
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

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [statusUpdatingItemId, setStatusUpdatingItemId] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, productsRes, ordersRes] = await Promise.all([
        api.get('/seller/analytics'),
        api.get('/products/mine/list?limit=100'),
        api.get('/seller/orders?limit=100')
      ]);
      setAnalytics(analyticsRes.data.data);
      setProducts(productsRes.data.data.products || []);
      setOrders(ordersRes.data.data.orders || []);
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

  if (loading && !analytics) {
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
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Order ID</span>
                    <span className="font-mono text-xs font-semibold text-slate-800">{order._id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Date Received</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Global Status</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full capitalize ${getStatusBadge(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Items of this seller list */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Items in Order</h4>
                    <div className="divide-y divide-slate-100">
                      {order.items.map((item) => (
                        <div key={item._id} className="py-3 flex justify-between items-center gap-4 first:pt-0">
                          <div className="flex items-center gap-3">
                            <img src={item.image} alt={item.title} className="w-10 h-10 object-cover rounded-lg border border-slate-100 bg-slate-50" />
                            <div>
                              <p className="font-semibold text-slate-800 text-xs truncate max-w-[200px]">{item.title}</p>
                              <p className="text-[10px] text-slate-400">Qty: {item.quantity} • price: ₹{item.price}</p>
                            </div>
                          </div>
                          
                          {/* Item status selector actions */}
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full capitalize select-none mr-2 ${getStatusBadge(item.itemStatus)}`}>
                              {item.itemStatus}
                            </span>
                            <select
                              value={item.itemStatus}
                              disabled={statusUpdatingItemId === item._id}
                              onChange={(e) => handleItemStatusUpdate(order._id, item._id, e.target.value)}
                              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-700 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping address details */}
                  <div className="bg-slate-50/50 border border-slate-100/50 p-4 rounded-2xl text-xs space-y-2">
                    <div className="flex items-center gap-1 text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">
                      <MapPin size={12} />
                      <span>Deliver to</span>
                    </div>
                    <p className="font-semibold text-slate-800">{order.shippingAddress.fullName}</p>
                    <p className="text-slate-600">{order.shippingAddress.street}</p>
                    <p className="text-slate-600">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                    <p className="text-slate-500 font-mono text-[10px] pt-1">Phone: {order.shippingAddress.phone}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reusable Product Add/Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={selectedProduct}
        onSaveSuccess={fetchDashboardData}
      />

      {/* Reusable Delete Confirmation modal */}
      <Modal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="Confirm Product Delete"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-rose-600 p-2 rounded-xl bg-rose-50/50">
            <ShieldAlert size={20} />
            <span className="text-xs font-semibold">Warning: This action is permanent and cannot be undone.</span>
          </div>
          <p className="text-xs text-slate-500">
            Are you sure you want to remove the listing for <span className="font-bold text-slate-800">"{productToDelete?.title}"</span> from the database?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setProductToDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>Delete Listing</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default SellerDashboard;
