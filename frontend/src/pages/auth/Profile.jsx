// Profile Page
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { User, Mail, Shield, ShieldCheck, MapPin, Key } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    oldPassword: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleUpdateInfo = (e) => {
    e.preventDefault();
    setLoading(true);
    // Mocking update as backend doesn't support profile edit endpoints currently
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
    setTimeout(() => {
      setLoading(false);
      setFormData((prev) => ({ ...prev, oldPassword: '', newPassword: '' }));
      showToast('Password changed successfully! (Demo)', 'success');
    }, 1000);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8 font-sans">
      
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-2xl font-display">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">{user.name}</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100/50 capitalize shadow-sm/50">
            <ShieldCheck size={14} />
            <span>{user.role} Account</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm/50 space-y-1">
            <button className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-50 text-indigo-700 transition-all">
              <User size={18} />
              <span>Personal Details</span>
            </button>
            <button className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
              <Key size={18} />
              <span>Security settings</span>
            </button>
            {user.role === 'customer' && (
              <button className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <MapPin size={18} />
                <span>My Addresses</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Form Panels */}
        <div className="md:col-span-2 space-y-8">
          
          {/* General Information Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Personal Details</h3>
              <p className="text-xs text-slate-400">Update your display name and email address details.</p>
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
                  disabled // Email change usually disabled or requires verification
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={loading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Password Change Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Change Password</h3>
              <p className="text-xs text-slate-400">Secure your account by updating your credentials.</p>
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

        </div>
      </div>
    </div>
  );
};

export default Profile;
