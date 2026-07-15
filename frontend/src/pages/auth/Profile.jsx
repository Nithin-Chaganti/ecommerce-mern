import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Skeleton from '../../components/common/Skeleton';
import { User, Mail, ShieldCheck, MapPin, Key, Upload, Trash2, Edit, Plus, Check, Loader2, Landmark } from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('details'); // details | security | addresses
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Address book states
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null); // id of address being edited
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    label: 'Home',
    isDefault: false
  });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    oldPassword: '',
    newPassword: '',
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleUpdateInfo = (e) => {
    e.preventDefault();
    setLoading(true);
    // Mock updating info since profile edit route is not available on backend auth.
    setTimeout(() => {
      setLoading(false);
      showToast('Profile information updated successfully! (Demo)', 'success');
    }, 1000);
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!formData.oldPassword || !formData.newPassword) {
      showToast('Please fill out all password fields', 'error');
      return;
    }
    setLoading(true);
    // Mock changing password since edit route is not available.
    setTimeout(() => {
      setLoading(false);
      setFormData((prev) => ({ ...prev, oldPassword: '', newPassword: '' }));
      showToast('Password changed successfully! (Demo)', 'success');
    }, 1000);
  };

  // ---------------------------------------------------------------------------
  // Avatar Photo Upload Logic
  // ---------------------------------------------------------------------------
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarUploading(true);
    const uploadData = new FormData();
    uploadData.append('avatar', file);

    try {
      const response = await api.post('/uploads/avatar', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newUrl = response.data.data.avatarUrl;
      // Update local context user state
      setUser((prev) => ({ ...prev, avatarUrl: newUrl }));
      showToast('Profile avatar updated successfully!', 'success');
    } catch (err) {
      console.error('Avatar upload failed:', err);
      showToast(err.response?.data?.message || 'Failed to upload profile avatar.', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Address Book Logic
  // ---------------------------------------------------------------------------
  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const response = await api.get('/address');
      setAddresses(response.data.data || []);
    } catch (err) {
      console.error('Failed to load addresses:', err);
      showToast('Failed to fetch saved addresses.', 'error');
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'addresses' && user?.role === 'customer') {
      fetchAddresses();
    }
  }, [activeTab]);

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddAddressClick = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      label: 'Home',
      isDefault: false
    });
    setIsAddingAddress(true);
  };

  const handleEditAddressClick = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      label: addr.label || 'Home',
      isDefault: addr.isDefault || false
    });
    setIsAddingAddress(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!addressForm.fullName || !addressForm.phone || !addressForm.street || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      showToast('Please fill out all required address fields.', 'warning');
      return;
    }

    setLoadingAddresses(true);
    try {
      if (editingAddressId) {
        // Edit existing address
        await api.patch(`/address/${editingAddressId}`, addressForm);
        showToast('Address updated successfully!', 'success');
      } else {
        // Add new address
        await api.post('/address', addressForm);
        showToast('Address added to address book successfully!', 'success');
      }
      setIsAddingAddress(false);
      setEditingAddressId(null);
      fetchAddresses();
    } catch (err) {
      console.error('Failed to save address:', err);
      showToast(err.response?.data?.message || 'Failed to save address.', 'error');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to remove this address?')) return;
    setLoadingAddresses(true);
    try {
      await api.delete(`/address/${addressId}`);
      showToast('Address removed from address book.', 'info');
      fetchAddresses();
    } catch (err) {
      console.error('Failed to delete address:', err);
      showToast('Failed to delete address.', 'error');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    setLoadingAddresses(true);
    try {
      await api.patch(`/address/${addressId}`, { isDefault: true });
      showToast('Default address updated!', 'success');
      fetchAddresses();
    } catch (err) {
      console.error('Failed to set default address:', err);
      showToast('Failed to update default setting.', 'error');
    } finally {
      setLoadingAddresses(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8 font-sans">
      
      {/* Header and Welcome / Avatar Upload */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          {/* Avatar Container with hover trigger */}
          <div className="relative group w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 shrink-0 bg-slate-50">
            {avatarUploading ? (
              <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-3xl font-display">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Upload Hover Overlay */}
            <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white cursor-pointer text-[10px] font-bold">
              <Upload size={16} className="mb-0.5" />
              <span>Upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">{user.name}</h1>
            <p className="text-sm text-slate-400 font-medium">{user.email}</p>
          </div>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100/50 capitalize shadow-sm/50">
            <ShieldCheck size={14} />
            <span>{user.role} Account</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-1">
            <button
              onClick={() => { setActiveTab('details'); setIsAddingAddress(false); }}
              className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === 'details' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <User size={18} />
              <span>Personal Details</span>
            </button>
            
            <button
              onClick={() => { setActiveTab('security'); setIsAddingAddress(false); }}
              className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === 'security' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Key size={18} />
              <span>Security Settings</span>
            </button>

            {user.role === 'customer' && (
              <button
                onClick={() => { setActiveTab('addresses'); setIsAddingAddress(false); }}
                className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === 'addresses' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <MapPin size={18} />
                <span>My Addresses</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Form Panels */}
        <div className="md:col-span-2">
          
          {/* General Information Form */}
          {activeTab === 'details' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Personal Details</h3>
                <p className="text-xs text-slate-400">Update your account name and registered email address details.</p>
              </div>

              <form onSubmit={handleUpdateInfo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="name"
                    type="text"
                    label="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <Input
                    id="email"
                    type="email"
                    label="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" loading={loading}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Password Change Form */}
          {activeTab === 'security' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Change Password</h3>
                <p className="text-xs text-slate-400">Secure your account by updating your login credentials.</p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="oldPassword"
                    type="password"
                    label="Current Password"
                    placeholder="••••••••"
                    value={formData.oldPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <Input
                    id="newPassword"
                    type="password"
                    label="New Password"
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" loading={loading}>
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Addresses tab Panel */}
          {activeTab === 'addresses' && user.role === 'customer' && (
            <div className="space-y-6 animate-fade-in">
              {isAddingAddress ? (
                /* Address creation form */
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">
                      {editingAddressId ? 'Edit Delivery Address' : 'Add New Address'}
                    </h3>
                    <p className="text-xs text-slate-400">Please provide a valid delivery shipping address.</p>
                  </div>

                  <form onSubmit={handleAddressSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Input
                          label="Recipient's Full Name"
                          name="fullName"
                          value={addressForm.fullName}
                          onChange={handleAddressChange}
                          placeholder="e.g. John Doe"
                          required
                        />
                      </div>
                      
                      <Input
                        label="Phone Number"
                        name="phone"
                        value={addressForm.phone}
                        onChange={handleAddressChange}
                        placeholder="e.g. +91 9999999999"
                        required
                      />

                      <Input
                        label="Address Label"
                        name="label"
                        value={addressForm.label}
                        onChange={handleAddressChange}
                        placeholder="e.g. Home, Office"
                      />

                      <div className="sm:col-span-2">
                        <Input
                          label="Street Address / Area / Locality"
                          name="street"
                          value={addressForm.street}
                          onChange={handleAddressChange}
                          placeholder="Flat/House No., Building Name, Street"
                          required
                        />
                      </div>

                      <Input
                        label="City"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressChange}
                        placeholder="e.g. Mumbai"
                        required
                      />

                      <Input
                        label="State"
                        name="state"
                        value={addressForm.state}
                        onChange={handleAddressChange}
                        placeholder="e.g. Maharashtra"
                        required
                      />

                      <Input
                        label="Pincode"
                        name="pincode"
                        value={addressForm.pincode}
                        onChange={handleAddressChange}
                        placeholder="e.g. 400001"
                        required
                      />

                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600">
                          <input
                            type="checkbox"
                            name="isDefault"
                            checked={addressForm.isDefault}
                            onChange={handleAddressChange}
                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                          />
                          <span>Set as Default Address</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="ghost" onClick={() => setIsAddingAddress(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" type="submit" loading={loadingAddresses}>
                        {editingAddressId ? 'Save Changes' : 'Add Address'}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Address Listing layout */
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-xs text-slate-500 font-semibold">Saved Addresses ({addresses.length})</span>
                    <Button variant="primary" size="sm" icon={Plus} onClick={handleAddAddressClick}>
                      Add Address
                    </Button>
                  </div>

                  {loadingAddresses && addresses.length === 0 ? (
                    <div className="space-y-4">
                      <Skeleton className="h-28 w-full rounded-2xl" />
                      <Skeleton className="h-28 w-full rounded-2xl" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
                      <MapPin className="mx-auto text-slate-300" size={40} />
                      <p className="text-sm font-semibold text-slate-500">No addresses saved yet</p>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">Add a delivery address to make checkout faster and easier.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr._id}
                          className={`bg-white p-5 rounded-3xl border shadow-sm/50 relative flex justify-between gap-4 group transition-all duration-300 ${
                            addr.isDefault ? 'border-indigo-300' : 'border-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-2 text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm capitalize">{addr.label || 'Home'}</span>
                              {addr.isDefault && (
                                <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100/50">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-slate-800 text-xs">{addr.fullName}</p>
                            <p>{addr.street}</p>
                            <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                            <p className="text-slate-500 font-mono text-[10px]">Phone: {addr.phone}</p>
                          </div>

                          <div className="flex flex-col justify-between items-end shrink-0">
                            {/* Default action button */}
                            {!addr.isDefault ? (
                              <button
                                onClick={() => handleSetDefaultAddress(addr._id)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Set as default
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-0.5">
                                <Check size={12} />
                                <span>Default</span>
                              </span>
                            )}

                            {/* Editing and Deleting actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditAddressClick(addr)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 bg-white transition-colors"
                                title="Edit Address"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr._id)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-400 hover:text-rose-600 bg-white transition-colors"
                                title="Delete Address"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;
