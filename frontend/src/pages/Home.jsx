import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, BadgePercent, LayoutGrid } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import Skeleton from '../components/common/Skeleton';
import Button from '../components/common/Button';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    // Fetch categories
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data.slice(0, 6) || []); // Limit to 6 categories for UI balance
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCats(false);
      }
    };

    // Fetch featured products (top rating or newest)
    const fetchFeaturedProducts = async () => {
      try {
        const response = await api.get('/products?limit=8');
        setFeaturedProducts(response.data.data.products || []);
      } catch (err) {
        console.error('Failed to load featured products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchCategories();
    fetchFeaturedProducts();
  }, []);

  return (
    <div className="space-y-16 pb-16 font-sans">
      
      {/* 1. Hero Section */}
      <section className="relative bg-slate-900 overflow-hidden py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center space-y-8">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/25">
            ✨ Premium Shopping Experience
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold font-display text-white tracking-tight leading-tight max-w-4xl">
            Discover a Market of <span className="text-indigo-400">Unlimited</span> Possibilities
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            ApexMarket brings together verified local sellers and worldwide premium brands in one elegant space. Explore high-quality goods, checked and approved by hand.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link to="/catalog">
              <Button variant="primary" size="lg" icon={ArrowRight}>
                Explore Catalog
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outlineWhite" size="lg">
                Join as Seller
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Value Features Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Free Delivery</h3>
              <p className="text-xs text-slate-400 mt-0.5">On all orders above ₹499. Swiftly delivered.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">100% Secure Payments</h3>
              <p className="text-xs text-slate-400 mt-0.5">Backed by industrial-grade payment processors.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
              <RefreshCw size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Easy Returns</h3>
              <p className="text-xs text-slate-400 mt-0.5">7-day worry-free replacements policy.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
              <BadgePercent size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Best Deals</h3>
              <p className="text-xs text-slate-400 mt-0.5">Guaranteed lowest margins from verified sellers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-display text-slate-900">Browse by Category</h2>
            <p className="text-xs text-slate-400">Select an option to filter our extensive inventory.</p>
          </div>
          <Link to="/catalog" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loadingCats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-2xl">
            <LayoutGrid className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-sm font-medium text-slate-500">No categories found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/catalog?category=${cat._id}`}
                className="group flex flex-col justify-center items-center p-6 bg-white border border-slate-100 rounded-2xl hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5 transition-all text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg select-none mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  {cat.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-semibold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. Featured Products (Hot Deals) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-display text-slate-900">Featured Releases</h2>
            <p className="text-xs text-slate-400">Discover handpicked arrivals from top stores.</p>
          </div>
          <Link to="/catalog" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <span>View Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-60 rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-sm font-medium text-slate-500">No products available in catalog currently.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default Home;

