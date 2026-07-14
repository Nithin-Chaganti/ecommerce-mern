import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, Star, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import Skeleton from '../components/common/Skeleton';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // API states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);

  // Filter UI states
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filter fields (controlled local inputs, synced to URL and backend query)
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [selectedCat, setSelectedCat] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);

  // Load categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCategories();
  }, []);

  // Synchronize local states when search params change (e.g. search from Navbar)
  useEffect(() => {
    setSearchVal(searchParams.get('search') || '');
    setSelectedCat(searchParams.get('category') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setMinRating(searchParams.get('minRating') || '');
    setInStock(searchParams.get('inStock') === 'true');
    setSortBy(searchParams.get('sortBy') || 'newest');
    setPage(parseInt(searchParams.get('page')) || 1);
  }, [searchParams]);

  // Query Backend with filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchVal) queryParams.set('search', searchVal);
      if (selectedCat) queryParams.set('category', selectedCat);
      if (minPrice) queryParams.set('minPrice', minPrice);
      if (maxPrice) queryParams.set('maxPrice', maxPrice);
      if (minRating) queryParams.set('minRating', minRating);
      if (inStock) queryParams.set('inStock', 'true');
      if (sortBy) queryParams.set('sortBy', sortBy);
      queryParams.set('page', page);
      queryParams.set('limit', 12); // Fetch 12 items per page

      const response = await api.get(`/products?${queryParams.toString()}`);
      const { products: fetchedProducts, pagination: pagDetails } = response.data.data;
      setProducts(fetchedProducts || []);
      setPagination(pagDetails || { currentPage: 1, totalPages: 1, totalCount: 0 });
    } catch (err) {
      console.error('Failed to fetch catalog products:', err);
    } finally {
      setLoading(false);
    }
  }, [searchVal, selectedCat, minPrice, maxPrice, minRating, inStock, sortBy, page]);

  // Perform fetching when local dependencies trigger
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Apply parameters back to searchParams (URL Sync)
  const applyFilters = (newFilters = {}) => {
    const params = new URLSearchParams();
    
    // Merge new filters with current states
    const updatedSearch = newFilters.search !== undefined ? newFilters.search : searchVal;
    const updatedCat = newFilters.category !== undefined ? newFilters.category : selectedCat;
    const updatedMin = newFilters.minPrice !== undefined ? newFilters.minPrice : minPrice;
    const updatedMax = newFilters.maxPrice !== undefined ? newFilters.maxPrice : maxPrice;
    const updatedRating = newFilters.minRating !== undefined ? newFilters.minRating : minRating;
    const updatedStock = newFilters.inStock !== undefined ? newFilters.inStock : inStock;
    const updatedSort = newFilters.sortBy !== undefined ? newFilters.sortBy : sortBy;
    const updatedPage = newFilters.page !== undefined ? newFilters.page : 1; // Default to page 1 on new filter change

    if (updatedSearch) params.set('search', updatedSearch);
    if (updatedCat) params.set('category', updatedCat);
    if (updatedMin) params.set('minPrice', updatedMin);
    if (updatedMax) params.set('maxPrice', updatedMax);
    if (updatedRating) params.set('minRating', updatedRating);
    if (updatedStock) params.set('inStock', 'true');
    if (updatedSort) params.set('sortBy', updatedSort);
    params.set('page', updatedPage);

    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };

  const handleClearFilters = () => {
    setSearchVal('');
    setSelectedCat('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setInStock(false);
    setSortBy('newest');
    setSearchParams(new URLSearchParams({ page: 1 }));
    setIsMobileFiltersOpen(false);
  };

  // Filter content template to reuse for desktop and mobile panels
  const renderFiltersContent = () => (
    <div className="space-y-6">
      
      {/* Category Selection */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800 font-display">Category</label>
        {loadingCats ? (
          <div className="space-y-1.5 pt-1">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-4 rounded-md" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto scrollbar-thin pr-1">
            <button
              onClick={() => applyFilters({ category: '' })}
              className={`text-left text-sm py-1 px-2.5 rounded-lg transition-all ${
                !selectedCat 
                  ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => applyFilters({ category: cat._id })}
                className={`text-left text-sm py-1 px-2.5 rounded-lg transition-all ${
                  selectedCat === cat._id 
                    ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price Limits Redesign */}
      <div className="space-y-3.5 pt-2 border-t border-slate-100">
        <label className="text-sm font-semibold text-slate-800 font-display">Price Range</label>
        
        {/* Predefined Price Buckets */}
        <div className="flex flex-col gap-1.5">
          {[
            { label: 'Under ₹500', min: '', max: '500' },
            { label: '₹500 - ₹2,000', min: '500', max: '2000' },
            { label: '₹2,000 - ₹5,000', min: '2000', max: '5000' },
            { label: '₹5,000 - ₹10,000', min: '5000', max: '10000' },
            { label: '₹10,000 & Above', min: '10000', max: '' }
          ].map((bucket, idx) => {
            const isSelected = (minPrice || '') === bucket.min && (maxPrice || '') === bucket.max;
            return (
              <button
                key={idx}
                onClick={() => applyFilters({ minPrice: bucket.min, maxPrice: bucket.max })}
                className={`text-left text-xs py-1.5 px-2.5 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {bucket.label}
              </button>
            );
          })}
        </div>

        {/* Custom Price Range Fields */}
        <div className="space-y-2 pt-2.5 border-t border-dashed border-slate-150">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custom Range</span>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">₹</span>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full pl-5 pr-1.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-bold">-</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">₹</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full pl-5 pr-1.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => applyFilters({ minPrice, maxPrice })}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 rounded-lg transition-colors text-xs font-bold shrink-0"
              title="Apply Custom price"
            >
              Go
            </button>
          </div>
        </div>
      </div>

      {/* Minimum Rating */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="text-sm font-semibold text-slate-800 font-display">Minimum Rating</label>
        <div className="flex flex-col gap-1.5">
          {[4, 3, 2].map((rating) => (
            <button
              key={rating}
              onClick={() => applyFilters({ minRating: rating.toString() })}
              className={`flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-lg text-left transition-all ${
                minRating === rating.toString()
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    fill={i < rating ? 'currentColor' : 'none'}
                    className="stroke-amber-400"
                  />
                ))}
              </div>
              <span>& Up</span>
            </button>
          ))}
          <button
            onClick={() => applyFilters({ minRating: '' })}
            className={`text-xs py-1 px-2.5 rounded-lg text-left transition-all ${
              !minRating
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Any Rating
          </button>
        </div>
      </div>

      {/* Availability / In Stock */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="inStockCheckbox"
            checked={inStock}
            onChange={(e) => applyFilters({ inStock: e.target.checked })}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          <label htmlFor="inStockCheckbox" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
            In Stock Only
          </label>
        </div>
      </div>

      {/* Clear Button */}
      <Button
        onClick={handleClearFilters}
        variant="ghost"
        size="sm"
        className="w-full text-slate-500 hover:text-indigo-600 text-xs py-2 rounded-lg font-bold border border-slate-100 hover:bg-slate-50 mt-4"
      >
        Reset All Filters
      </Button>

    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* 1. Page Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">Search Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">
            {pagination.totalCount} product{pagination.totalCount !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-3">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500 hidden md:inline">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => applyFilters({ sortBy: e.target.value })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 shadow-sm"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="priceLowHigh">Price: Low to High</option>
              <option value="priceHighLow">Price: High to Low</option>
              <option value="rating">Avg. Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Side: Desktop Sidebar Filters */}
        <aside className="hidden lg:block bg-white p-6 rounded-2xl border border-slate-100 shadow-sm/50 space-y-6 sticky top-20">
          <div className="flex justify-between items-center pb-3 border-b border-slate-50">
            <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-1.5">
              <SlidersHorizontal size={16} className="text-indigo-600" />
              <span>Filters</span>
            </h3>
          </div>
          {renderFiltersContent()}
        </aside>

        {/* Right Side: Products Area */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Top Search Input Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full shadow-sm bg-white rounded-2xl border border-slate-100 p-2 flex gap-2">
            <div className="flex-1 relative flex items-center">
              <Search className="absolute left-4 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Find item title, description or keyword..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-transparent border-0 focus:outline-none placeholder-slate-400 text-slate-800"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="rounded-xl px-5">
              Search
            </Button>
          </form>

          {/* Catalog grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-64 rounded-2xl animate-pulse" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-slate-50 text-slate-400 rounded-full">
                <SlidersHorizontal size={36} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 font-display">No Results Match</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Try widening your price range, clearing search terms, or checking general spelling.
              </p>
              <Button onClick={handleClearFilters} variant="secondary">
                Reset All Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-100">
                  <Button
                    onClick={() => applyFilters({ page: page - 1 })}
                    disabled={page <= 1}
                    variant="secondary"
                    size="sm"
                    className="p-2.5 rounded-xl shadow-none active:scale-95"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  
                  <div className="flex gap-1">
                    {[...Array(pagination.totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => applyFilters({ page: pageNum })}
                          className={`w-9 h-9 text-xs font-bold rounded-xl transition-all ${
                            page === pageNum
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                              : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    onClick={() => applyFilters({ page: page + 1 })}
                    disabled={page >= pagination.totalPages}
                    variant="secondary"
                    size="sm"
                    className="p-2.5 rounded-xl shadow-none active:scale-95"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </>
          )}

        </div>

      </div>

      {/* 3. Mobile Filters Drawer (Modal overlay) */}
      <Modal
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        title="Filter & Sort"
        size="sm"
      >
        <div className="pt-2">
          {renderFiltersContent()}
        </div>
      </Modal>

    </div>
  );
};

export default Catalog;
