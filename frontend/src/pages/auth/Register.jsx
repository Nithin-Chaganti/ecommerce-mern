// Register Page
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { User, Mail, Lock, ShoppingBag, Store } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Role: 'customer' or 'seller'
  const [role, setRole] = useState('customer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Sync role selection from query params (e.g. ?role=seller)
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'seller' || roleParam === 'customer') {
      setRole(roleParam);
    }
  }, [searchParams]);

  const validate = () => {
    const tempErrors = {};
    if (!formData.name) tempErrors.name = 'Full name is required';
    
    if (!formData.email) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Invalid email address';
    }
    
    if (!formData.password) {
      tempErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (role === 'seller' && !formData.storeName) {
      tempErrors.storeName = 'Store name is required for seller accounts';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      role,
      role === 'seller' ? formData.storeName : undefined
    );
    setLoading(false);

    if (result.success) {
      showToast(result.message || 'Registration successful! Please log in.', 'success');
      navigate('/login');
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/50">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Join us to browse top deals or start selling online.
          </p>
        </div>

        {/* Tab Selector between Customer & Seller */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              role === 'customer'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User size={16} />
            <span>Customer</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('seller')}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              role === 'seller'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store size={16} />
            <span>Seller / Vendor</span>
          </button>
        </div>

        {/* Info Box */}
        {role === 'seller' && (
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 text-xs text-indigo-800 leading-relaxed animate-slide-down">
            💡 <strong>Vendor Account:</strong> Creating a seller profile allows you to publish products, configure pricing, track shipments, and receive payouts. Approvals are checked by our administrators.
          </div>
        )}

        {/* Registration Form */}
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-3.5 top-[38px] text-slate-400 z-10" size={18} />
              <Input
                id="name"
                type="text"
                label="Full Name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                className="pl-6"
                disabled={loading}
              />
            </div>

            {/* Email Address */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-[38px] text-slate-400 z-10" size={18} />
              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                className="pl-6"
                disabled={loading}
              />
            </div>

            {/* Store Name - Seller Only */}
            {role === 'seller' && (
              <div className="relative animate-slide-up">
                <Store className="absolute left-3.5 top-[38px] text-slate-400 z-10" size={18} />
                <Input
                  id="storeName"
                  type="text"
                  label="Store / Business Name"
                  placeholder="Apex Superstore"
                  value={formData.storeName}
                  onChange={handleChange}
                  error={errors.storeName}
                  className="pl-6"
                  disabled={loading}
                />
              </div>
            )}

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-[38px] text-slate-400 z-10" size={18} />
              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                className="pl-6"
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-[38px] text-slate-400 z-10" size={18} />
              <Input
                id="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                className="pl-6"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full text-sm font-semibold mt-2"
              loading={loading}
            >
              Register Account
            </Button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="text-center text-sm text-slate-500 border-t border-slate-50 pt-6 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
