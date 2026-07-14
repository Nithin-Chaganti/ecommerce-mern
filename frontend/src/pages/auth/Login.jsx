// Login Page
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Lock, Mail, ShoppingBag } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Parse redirect path if exists in router state
  const from = location.state?.from?.pathname || '/';

  const validate = () => {
    const tempErrors = {};
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
    const result = await login(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      showToast('Logged in successfully!', 'success');
      navigate(from, { replace: true });
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/50">
        
        {/* Brand/Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your dashboard, orders, and wishlist.
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
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
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-slate-600 select-none">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full text-sm font-semibold"
              loading={loading}
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="text-center text-sm text-slate-500 border-t border-slate-50 pt-6 mt-6">
          New to ApexMarket?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
            Create an account
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
