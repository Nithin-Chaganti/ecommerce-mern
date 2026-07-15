import React, { useState, useEffect } from 'react';
import { Shield, ClipboardCheck, BadgePercent, Users, Check, X, Trash2, ShieldAlert, Plus, Calendar, CreditCard, Lock } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Skeleton from '../../components/common/Skeleton';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { showToast } = useToast();
  const { user: currentAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('catalog'); // catalog | coupons | users
  const [loading, setLoading] = useState(true);

  // States for tabs
  const [pendingProducts, setPendingProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingSellers, setPendingSellers] = useState([]);

  // Coupon Creation Form
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '',
    expiresAt: '',
    usageLimit: ''
  });
  const [couponErrors, setCouponErrors] = useState({});
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  // User list filters
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');

  const fetchTabDetails = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'catalog') {
        const response = await api.get('/products?status=pending');
        setPendingProducts(response.data.data.products || []);
      } else if (tab === 'coupons') {
        const response = await api.get('/coupons');
        setCoupons(response.data.data || []);
      } else if (tab === 'users') {
        const url = selectedRoleFilter ? `/admin/users?role=${selectedRoleFilter}` : '/admin/users';
        const response = await api.get(url);
        setUsers(response.data.data.users || []);
      } else if (tab === 'sellers') {
        const response = await api.get('/admin/sellers/pending');
        setPendingSellers(response.data.data.profiles || []);
      }
    } catch (err) {
      console.error(`Failed to fetch ${tab} details:`, err);
      showToast(`Error fetching ${tab} metrics.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSellerApproval = async (profileId, status, rejectionReason = '') => {
    try {
      await api.patch(`/admin/sellers/${profileId}/approval`, { status, rejectionReason });
      showToast(`Seller status successfully updated to ${status}!`, 'success');
      setPendingSellers((prev) => prev.filter((p) => p._id !== profileId));
    } catch (err) {
      console.error('Failed to update seller status:', err);
      showToast('Failed to update seller verification status.', 'error');
    }
  };

  useEffect(() => {
    fetchTabDetails(activeTab);
  }, [activeTab, selectedRoleFilter]);

  // Catalog approvals
  const handleApprovalAction = async (productId, status) => {
    try {
      await api.patch(`/products/${productId}/approval`, { status });
      showToast(`Product listing successfully ${status}!`, 'success');
      setPendingProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (err) {
      console.error(`Failed to update approval for product ${productId}:`, err);
      showToast(err.response?.data?.message || 'Failed to update approval.', 'error');
    }
  };

  // Coupon creations
  const handleCouponChange = (e) => {
    const { name, value } = e.target;
    setCouponForm((prev) => ({
      ...prev,
      [name]: name === 'discountValue' || name === 'minOrderValue' || name === 'usageLimit'
        ? (value === '' ? '' : Number(value))
        : value
    }));
    if (couponErrors[name]) {
      setCouponErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!couponForm.code.trim()) errors.code = 'Coupon code is required';
    if (couponForm.discountValue === '' || couponForm.discountValue < 0) errors.discountValue = 'Value must be positive';
    if (!couponForm.expiresAt) errors.expiresAt = 'Expiry date is required';

    if (Object.keys(errors).length > 0) {
      setCouponErrors(errors);
      return;
    }

    setCreatingCoupon(true);
    try {
      const response = await api.post('/coupons', couponForm);
      showToast('Discount coupon created successfully!', 'success');
      setCoupons((prev) => [...prev, response.data.data]);
      setIsCouponModalOpen(false);
      setCouponForm({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderValue: '',
        expiresAt: '',
        usageLimit: ''
      });
    } catch (err) {
      console.error('Failed to create coupon:', err);
      showToast(err.response?.data?.message || 'Failed to create coupon.', 'error');
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleCouponDelete = async (couponId) => {
    try {
      await api.delete(`/coupons/${couponId}`);
      showToast('Coupon code deleted successfully!', 'success');
      setCoupons((prev) => prev.filter((c) => c._id !== couponId));
    } catch (err) {
      console.error('Coupon deletion failed:', err);
      showToast('Failed to delete coupon.', 'error');
    }
  };

  // User account active status modification
  const handleToggleUserStatus = async (userId, currentStatus) => {
    if (userId === currentAdmin?.id) {
      showToast('You cannot suspend your own administrative account.', 'warning');
      return;
    }
    const newStatus = !currentStatus;
    try {
      await api.patch(`/admin/users/${userId}/status`, { isActive: newStatus });
      showToast(`User status updated successfully!`, 'success');
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId || u._id === userId ? { ...u, isActive: newStatus } : u))
      );
    } catch (err) {
      console.error(`Status toggle failed for user ${userId}:`, err);
      showToast('Failed to toggle user activation state.', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'true':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'pending':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'rejected':
      case 'suspended':
      case 'false':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-8 font-sans">
      
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <Shield size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">Admin Control Panel</h1>
          <p className="text-xs text-slate-400">Moderate product listings, manage discount codes, and control account status.</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-100 gap-6">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'catalog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <ClipboardCheck size={18} />
          <span>Product Approvals ({activeTab === 'catalog' && !loading ? pendingProducts.length : '...'})</span>
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'coupons' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <BadgePercent size={18} />
          <span>Discount Coupons ({activeTab === 'coupons' && !loading ? coupons.length : '...'})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users size={18} />
          <span>User Profiles</span>
        </button>
        <button
          onClick={() => setActiveTab('sellers')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'sellers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <ShieldCheck size={18} />
          <span>Seller Onboarding ({activeTab === 'sellers' && !loading ? pendingSellers.length : '...'})</span>
        </button>
      </div>

      {/* Tab content panels */}
      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      ) : (
        <div className="animate-fade-in">
          
          {/* Catalog Verification */}
          {activeTab === 'catalog' && (
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              {pendingProducts.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <ClipboardCheck className="mx-auto text-slate-300" size={48} />
                  <p className="text-sm font-semibold text-slate-500">All uploaded products verified. Inbox clear!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-4 px-6">Product details</th>
                        <th className="py-4 px-6">Pricing</th>
                        <th className="py-4 px-6">Description</th>
                        <th className="py-4 px-6 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-slate-50">
                      {pendingProducts.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 flex items-center gap-3 min-w-[200px]">
                            <img src={p.images[0]} alt={p.title} className="w-12 h-12 object-cover rounded-xl border border-slate-100 bg-slate-50 shrink-0" />
                            <div>
                              <p className="font-semibold text-slate-800 truncate max-w-[150px]">{p.title}</p>
                              <p className="text-[10px] text-slate-400">Stock: {p.stock} units</p>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-800 whitespace-nowrap">
                            ₹{p.price}
                          </td>
                          <td className="py-4 px-6 text-slate-500 max-w-sm truncate">
                            {p.description}
                          </td>
                          <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleApprovalAction(p._id, 'approved')}
                              className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-100 rounded-xl transition-all font-semibold inline-flex items-center gap-1"
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleApprovalAction(p._id, 'rejected')}
                              className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-100 rounded-xl transition-all font-semibold inline-flex items-center gap-1"
                            >
                              <X size={14} />
                              <span>Reject</span>
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

          {/* Coupons Manager */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button variant="primary" icon={Plus} onClick={() => setIsCouponModalOpen(true)}>
                  Create Coupon
                </Button>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                {coupons.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <BadgePercent className="mx-auto text-slate-300" size={48} />
                    <p className="text-sm font-semibold text-slate-500">No discount coupons active</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-4 px-6">Coupon Code</th>
                          <th className="py-4 px-6">Discount type</th>
                          <th className="py-4 px-6">Value</th>
                          <th className="py-4 px-6">Min Order</th>
                          <th className="py-4 px-6">Expiry</th>
                          <th className="py-4 px-6 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-slate-50">
                        {coupons.map((c) => (
                          <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-mono font-bold text-slate-800">
                              {c.code}
                            </td>
                            <td className="py-4 px-6 capitalize font-semibold text-slate-500">
                              {c.discountType}
                            </td>
                            <td className="py-4 px-6 font-bold text-slate-800">
                              {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                            </td>
                            <td className="py-4 px-6 text-slate-500">
                              ₹{c.minOrderValue || 0}
                            </td>
                            <td className="py-4 px-6 text-slate-500">
                              {new Date(c.expiresAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleCouponDelete(c._id)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-rose-500 hover:text-rose-600 transition-all bg-white"
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
            </div>
          )}

          {/* User Account Status Manager */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Role filter bar */}
              <div className="flex gap-2">
                {['', 'customer', 'seller', 'admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRoleFilter(role)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                      selectedRoleFilter === role
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {role === '' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                {users.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-sm font-semibold text-slate-500">No users match this role query</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-4 px-6">Name</th>
                          <th className="py-4 px-6">Email Address</th>
                          <th className="py-4 px-6">Role</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Fulfillment</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-slate-50">
                        {users.map((u) => {
                          const userId = u.id || u._id;
                          return (
                            <tr key={userId} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6 font-semibold text-slate-800">
                                {u.name}
                              </td>
                              <td className="py-4 px-6 text-slate-500">
                                {u.email}
                              </td>
                              <td className="py-4 px-6 capitalize text-slate-500 font-medium">
                                {u.role}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full capitalize ${getStatusColor(String(u.isActive))}`}>
                                  {u.isActive ? 'Active' : 'Suspended'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                {userId === currentAdmin?.id ? (
                                  <span className="text-[10px] text-slate-400 font-bold flex justify-end items-center gap-1 select-none pr-2">
                                    <Lock size={12} />
                                    <span>Current Admin</span>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleToggleUserStatus(userId, u.isActive)}
                                    className={`px-3 py-1 text-[10px] font-bold border rounded-xl transition-all ${
                                      u.isActive
                                        ? 'bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border-rose-100'
                                        : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-100'
                                    }`}
                                  >
                                    {u.isActive ? 'Suspend' : 'Activate'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Seller Onboarding Verification approvals panel */}
          {activeTab === 'sellers' && (
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              {pendingSellers.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <ShieldCheck className="mx-auto text-slate-300" size={48} />
                  <p className="text-sm font-semibold text-slate-500">No pending seller registrations. Inbox clear!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-4 px-6">Store Details</th>
                        <th className="py-4 px-6">GSTIN</th>
                        <th className="py-4 px-6">Verification Document</th>
                        <th className="py-4 px-6 text-right">Moderation</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-slate-50">
                      {pendingSellers.map((seller) => (
                        <tr key={seller._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 min-w-[200px] space-y-1">
                            <p className="font-semibold text-slate-800">{seller.storeName}</p>
                            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[220px]">
                              {seller.storeDescription || 'No description provided.'}
                            </p>
                            <p className="text-[9px] text-slate-500 font-medium">
                              User: {seller.user?.name} ({seller.user?.email})
                            </p>
                          </td>
                          <td className="py-4 px-6 font-semibold font-mono text-slate-800">
                            {seller.gstin}
                          </td>
                          <td className="py-4 px-6">
                            {seller.verificationDocumentUrl ? (
                              <a
                                href={seller.verificationDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold"
                              >
                                View Certificate Document →
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">No document</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleSellerApproval(seller._id, 'approved')}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-100 rounded-xl font-bold transition-all cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = window.prompt('Enter rejection reason:');
                                if (reason !== null) handleSellerApproval(seller._id, 'rejected', reason);
                              }}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-100 rounded-xl font-bold transition-all cursor-pointer"
                            >
                              Reject
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

        </div>
      )}

      {/* Coupon creation modal */}
      <Modal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        title="Create Discount Coupon"
      >
        <form onSubmit={handleCouponSubmit} className="space-y-4 font-sans text-xs">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Coupon Code"
                name="code"
                value={couponForm.code}
                onChange={handleCouponChange}
                placeholder="e.g. SAVEMORE20"
                error={couponErrors.code}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Discount Type
              </label>
              <select
                name="discountType"
                value={couponForm.discountType}
                onChange={handleCouponChange}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Cash (₹)</option>
              </select>
            </div>

            <div>
              <Input
                label="Discount Value"
                type="number"
                name="discountValue"
                value={couponForm.discountValue}
                onChange={handleCouponChange}
                placeholder={couponForm.discountType === 'percentage' ? 'e.g. 15' : 'e.g. 150'}
                error={couponErrors.discountValue}
                required
              />
            </div>

            <div>
              <Input
                label="Min Order Amount (₹)"
                type="number"
                name="minOrderValue"
                value={couponForm.minOrderValue}
                onChange={handleCouponChange}
                placeholder="e.g. 499 (optional)"
              />
            </div>

            <div>
              <Input
                label="Usage Limit"
                type="number"
                name="usageLimit"
                value={couponForm.usageLimit}
                onChange={handleCouponChange}
                placeholder="e.g. 100 (optional)"
              />
            </div>

            <div className="col-span-2">
              <Input
                label="Expiry Date"
                type="date"
                name="expiresAt"
                value={couponForm.expiresAt}
                onChange={handleCouponChange}
                error={couponErrors.expiresAt}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsCouponModalOpen(false)} disabled={creatingCoupon}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={creatingCoupon}>
              Submit Coupon
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AdminDashboard;
