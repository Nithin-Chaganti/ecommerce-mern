import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Button from './components/common/Button';
import { ShieldAlert } from 'lucide-react';

// Lazy load route pages
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const Profile = React.lazy(() => import('./pages/auth/Profile'));
const Home = React.lazy(() => import('./pages/Home'));
const Catalog = React.lazy(() => import('./pages/Catalog'));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Wishlist = React.lazy(() => import('./pages/Wishlist'));
const Orders = React.lazy(() => import('./pages/Orders'));
const SellerDashboard = React.lazy(() => import('./pages/seller/SellerDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));

const PageLoader = () => (
  <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-400 select-none">Loading page components...</span>
    </div>
  </div>
);

// Temporary Unauthorized Page
const Unauthorized = () => {
  return (
    <div className="min-h-[70vh] flex flex-col justify-center items-center bg-slate-50 py-16 px-4 text-center space-y-6 font-sans">
      <div className="inline-flex items-center justify-center p-4 bg-rose-50 text-rose-600 rounded-full">
        <ShieldAlert size={48} />
      </div>
      <h1 className="text-3xl font-bold font-display text-slate-900">Access Denied</h1>
      <p className="text-slate-500 max-w-md">
        You do not have the necessary permissions or the correct user role to access this area.
      </p>
      <Link to="/">
        <Button variant="primary">Return Home</Button>
      </Link>
    </div>
  );
};

// Temporary Not Found Page
const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col justify-center items-center bg-slate-50 py-16 px-4 text-center space-y-6 font-sans">
      <h1 className="text-6xl font-extrabold font-display text-indigo-600">404</h1>
      <h2 className="text-2xl font-bold text-slate-900">Page Not Found</h2>
      <p className="text-slate-500 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/">
        <Button variant="primary">Return Home</Button>
      </Link>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <div className="flex flex-col min-h-screen">
                {/* Header Navigation */}
                <Navbar />

                {/* Main Content Area */}
                <main className="flex-1 bg-slate-50">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/unauthorized" element={<Unauthorized />} />
                      <Route path="/catalog" element={<Catalog />} />
                      <Route path="/product/:productId" element={<ProductDetails />} />

                      {/* Customer Protected Routes */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/cart"
                        element={
                          <ProtectedRoute allowedRoles={['customer']}>
                            <Cart />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/wishlist"
                        element={
                          <ProtectedRoute allowedRoles={['customer']}>
                            <Wishlist />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/orders"
                        element={
                          <ProtectedRoute allowedRoles={['customer']}>
                            <Orders />
                          </ProtectedRoute>
                        }
                      />

                      {/* Seller Protected Routes */}
                      <Route
                        path="/seller/dashboard"
                        element={
                          <ProtectedRoute allowedRoles={['seller']}>
                            <SellerDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin Protected Routes */}
                      <Route
                        path="/admin/dashboard"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Fallback Route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>

                {/* Footer */}
                <Footer />
              </div>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
