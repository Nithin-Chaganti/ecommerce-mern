import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { ShoppingBag, Search, ShoppingCart, Heart, User, LogOut, Menu, X, Settings, ClipboardList, Store } from 'lucide-react';
import Button from '../common/Button';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const wishlistCount = wishlist?.products?.length || 0;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-slate-900 hover:text-indigo-600 transition-colors shrink-0">
            <ShoppingBag className="text-indigo-600" size={26} />
            <span>ApexMarket</span>
          </Link>

          {/* Search Bar - Hidden on Mobile */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-lg relative">
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <Search size={18} />
            </button>
          </form>

          {/* Right Actions Menu */}
          <div className="hidden md:flex items-center gap-4 text-slate-600">
            
            {/* Wishlist Link */}
            <Link to="/wishlist" className="relative p-2 hover:text-indigo-600 transition-colors" aria-label="Wishlist">
              <Heart size={22} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Link */}
            <Link to="/cart" className="relative p-2 hover:text-indigo-600 transition-colors" aria-label="Cart">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full border border-slate-200 hover:border-indigo-300 transition-all hover:bg-slate-50 active:scale-95"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-semibold flex items-center justify-center text-sm font-display select-none">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>

                {isDropdownOpen && (
                  <>
                    {/* Backdrop cover for clicking out */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                    
                    <div className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-slide-up origin-top-right">
                      {/* User Header */}
                      <div className="px-4 py-2 border-b border-slate-50">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100/50 capitalize">
                          {user.role}
                        </span>
                      </div>

                      {/* Options based on Role */}
                      <div className="py-1">
                        {user.role === 'customer' && (
                          <>
                            <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600" onClick={() => setIsDropdownOpen(false)}>
                              <User size={16} />
                              <span>My Profile</span>
                            </Link>
                            <Link to="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600" onClick={() => setIsDropdownOpen(false)}>
                              <ClipboardList size={16} />
                              <span>My Orders</span>
                            </Link>
                          </>
                        )}

                        {user.role === 'seller' && (
                          <>
                            <Link to="/seller/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600" onClick={() => setIsDropdownOpen(false)}>
                              <Store size={16} />
                              <span>Seller Dashboard</span>
                            </Link>
                            <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600" onClick={() => setIsDropdownOpen(false)}>
                              <User size={16} />
                              <span>Shop Settings</span>
                            </Link>
                          </>
                        )}

                        {user.role === 'admin' && (
                          <>
                            <Link to="/admin/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600" onClick={() => setIsDropdownOpen(false)}>
                              <Settings size={16} />
                              <span>Admin Panel</span>
                            </Link>
                            <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600" onClick={() => setIsDropdownOpen(false)}>
                              <User size={16} />
                              <span>Admin Profile</span>
                            </Link>
                          </>
                        )}
                      </div>

                      <div className="border-t border-slate-50 pt-1 mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50/50"
                        >
                          <LogOut size={16} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Register</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Burger Menu Button - Visible on Mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-4 animate-fade-in">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search products, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <Search size={18} />
            </button>
          </form>

          {/* Links */}
          <div className="flex flex-col gap-2 pt-2">
            <Link
              to="/cart"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={20} className="text-slate-500" />
                <span>My Cart</span>
              </div>
              {cartCount > 0 && (
                <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              to="/wishlist"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="flex items-center gap-2.5">
                <Heart size={20} className="text-slate-500" />
                <span>My Wishlist</span>
              </div>
              {wishlistCount > 0 && (
                <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="border-t border-slate-100 pt-3 mt-1 space-y-1">
                <div className="px-3 pb-3">
                  <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>

                {user.role === 'customer' && (
                  <>
                    <Link to="/profile" className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-slate-50 text-slate-600" onClick={() => setIsMobileMenuOpen(false)}>
                      <User size={18} />
                      <span>Profile Settings</span>
                    </Link>
                    <Link to="/orders" className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-slate-50 text-slate-600" onClick={() => setIsMobileMenuOpen(false)}>
                      <ClipboardList size={18} />
                      <span>My Orders</span>
                    </Link>
                  </>
                )}

                {user.role === 'seller' && (
                  <>
                    <Link to="/seller/dashboard" className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-slate-50 text-slate-600" onClick={() => setIsMobileMenuOpen(false)}>
                      <Store size={18} />
                      <span>Seller Dashboard</span>
                    </Link>
                    <Link to="/profile" className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-slate-50 text-slate-600" onClick={() => setIsMobileMenuOpen(false)}>
                      <User size={18} />
                      <span>Shop Settings</span>
                    </Link>
                  </>
                )}

                {user.role === 'admin' && (
                  <>
                    <Link to="/admin/dashboard" className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-slate-50 text-slate-600" onClick={() => setIsMobileMenuOpen(false)}>
                      <Settings size={18} />
                      <span>Admin Panel</span>
                    </Link>
                    <Link to="/profile" className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-slate-50 text-slate-600" onClick={() => setIsMobileMenuOpen(false)}>
                      <User size={18} />
                      <span>Profile</span>
                    </Link>
                  </>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full p-3 rounded-xl text-rose-600 hover:bg-rose-50/50 font-medium"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="secondary" className="w-full">Login</Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

