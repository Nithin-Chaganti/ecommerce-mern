import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, ShieldCheck, ChevronLeft, Calendar, Send } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Skeleton from '../components/common/Skeleton';
import ProductCard from '../components/product/ProductCard';

const ProductDetails = () => {
  const { productId } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  // Core Product Data
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Recommendations state
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  // Sentiment badge color styling
  const getSentimentColor = (label) => {
    switch (label) {
      case 'positive':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100/50';
      case 'negative':
        return 'bg-rose-50 text-rose-600 border-rose-100/50';
      case 'neutral':
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100/50';
    }
  };

  // Recommendations calculation
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product || !product.category) return;
      setRelatedLoading(true);
      try {
        const catId = typeof product.category === 'object' ? product.category._id : product.category;
        const response = await api.get(`/products?category=${catId}&limit=12`);
        const list = response.data.data.products || [];
        const filteredList = list.filter((p) => p._id !== product._id);
        const currentTags = product.tags || [];
        const rankedList = filteredList.map((p) => {
          const pTags = p.tags || [];
          const overlap = pTags.filter((t) => currentTags.includes(t)).length;
          return { ...p, overlap };
        });
        rankedList.sort((a, b) => b.overlap - a.overlap);
        setRelatedProducts(rankedList.slice(0, 4));
      } catch (err) {
        console.error('Failed to load related products:', err);
      } finally {
        setRelatedLoading(false);
      }
    };
    fetchRelatedProducts();
  }, [product]);

  // Fetch product information
  const fetchProduct = useCallback(async () => {
    try {
      const response = await api.get(`/products/${productId}`);
      setProduct(response.data.data);
    } catch (err) {
      console.error('Failed to load product details:', err);
      showToast('Product not found', 'error');
    } finally {
      setLoading(false);
    }
  }, [productId, showToast]);

  // Fetch reviews list
  const fetchReviews = useCallback(async () => {
    try {
      const response = await api.get(`/reviews/product/${productId}`);
      setReviews(response.data.data.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    setLoading(true);
    setReviewsLoading(true);
    fetchProduct();
    fetchReviews();
  }, [productId, fetchProduct, fetchReviews]);

  const handleWishlistToggle = async () => {
    if (!product) return;
    const isWishlisted = isInWishlist(product._id);
    if (isWishlisted) {
      await removeFromWishlist(product._id);
    } else {
      await addToWishlist(product._id);
    }
  };

  const handleAddToCartSubmit = async () => {
    if (!product) return;
    await addToCart(product._id, quantity);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      showToast('Please type a comment for your review', 'warning');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        productId,
        rating: newRating,
        comment: newComment.trim(),
      });
      showToast('Review submitted successfully!', 'success');
      setNewComment('');
      setNewRating(5);
      // Reload reviews and product rating metadata
      fetchReviews();
      fetchProduct();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit review';
      showToast(errorMsg, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleHideReview = async (reviewId) => {
    try {
      await api.patch(`/reviews/${reviewId}/moderate`, { isApproved: false });
      showToast('Review has been hidden from public catalog.', 'success');
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      fetchProduct();
    } catch (err) {
      console.error('Failed to moderate review:', err);
      showToast('Failed to hide review.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Skeleton className="h-[450px] rounded-3xl" />
          <div className="space-y-6">
            <Skeleton className="h-8 w-1/3 rounded-lg" />
            <Skeleton className="h-12 w-3/4 rounded-lg" />
            <Skeleton className="h-6 w-1/4 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4 font-sans">
        <h2 className="text-2xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-slate-500">The product you are trying to view is unavailable or deleted.</p>
        <Link to="/catalog">
          <Button variant="primary">Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  // Cost calculations
  const originalPrice = product.price;
  const discountPercent = product.discountPercent || 0;
  const discountedPrice = discountPercent > 0 
    ? Math.round(originalPrice * (1 - discountPercent / 100))
    : originalPrice;

  const isWishlisted = isInWishlist(product._id);
  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans space-y-12">
      
      {/* Back Button */}
      <Link to="/catalog" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
        <ChevronLeft size={16} />
        <span>Back to Catalog</span>
      </Link>

      {/* 1. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Side: Photo Gallery */}
        <div className="space-y-4">
          <div className="relative pt-[100%] rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm">
            <img
              src={images[activeImageIndex]}
              alt={product.title}
              className="absolute inset-0 w-full h-full object-contain p-6"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-1 scrollbar-thin">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border bg-white shrink-0 p-1.5 transition-all ${
                    activeImageIndex === idx 
                      ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-sm' 
                      : 'border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Meta & Checkout */}
        <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm/50">
          <div className="space-y-2">
            {product.category?.name && (
              <span className="inline-block px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100/50">
                {product.category.name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 leading-tight">
              {product.title}
            </h1>

            {/* Ratings summary */}
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.round(product.ratingsAverage || 0) ? 'currentColor' : 'none'}
                    className="stroke-amber-400"
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-800">
                {product.ratingsAverage?.toFixed(1) || '0.0'}
              </span>
              <span className="text-xs text-slate-400">
                ({product.ratingsCount || 0} customer review{product.ratingsCount !== 1 ? 's' : ''})
              </span>
            </div>
          </div>

          {/* Pricing Block */}
          <div className="flex items-baseline gap-3 py-3 border-y border-slate-50">
            <span className="text-3xl font-extrabold text-slate-900 font-display">
              ₹{discountedPrice.toLocaleString('en-IN')}
            </span>
            {discountPercent > 0 && (
              <>
                <span className="text-lg text-slate-400 line-through">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Save ₹{(originalPrice - discountedPrice).toLocaleString('en-IN')}
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product Overview</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Seller / Store Identity Block */}
          {product.seller && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Seller Details</span>
                <span className="text-sm font-semibold text-slate-800 font-display">
                  {product.seller.storeName || 'Apex verified Partner'}
                </span>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full capitalize">
                Verified Store
              </span>
            </div>
          )}

          {/* Stock status indicator */}
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="text-xs font-semibold text-slate-700">
              {product.stock > 0 ? `In Stock (${product.stock} units available)` : 'Temporarily Out of Stock'}
            </span>
          </div>

          {/* Purchase Actions */}
          <div className="flex items-center gap-4 pt-4">
            {product.stock > 0 && (
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm/50">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2.5 text-slate-500 hover:bg-slate-50 active:scale-95 transition-all text-sm font-bold"
                >
                  -
                </button>
                <span className="px-3 text-sm font-bold text-slate-800 w-8 text-center select-none">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-3.5 py-2.5 text-slate-500 hover:bg-slate-50 active:scale-95 transition-all text-sm font-bold"
                >
                  +
                </button>
              </div>
            )}

            <Button
              onClick={handleAddToCartSubmit}
              disabled={product.stock <= 0}
              variant={product.stock > 0 ? 'primary' : 'secondary'}
              className="flex-1 rounded-xl py-3 shadow-md/50 gap-2 font-bold"
            >
              <ShoppingCart size={18} />
              <span>{product.stock > 0 ? 'Add to Shopping Cart' : 'Out of Stock'}</span>
            </Button>

            <button
              onClick={handleWishlistToggle}
              className={`p-3 rounded-xl border active:scale-90 transition-all ${
                isWishlisted
                  ? 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100'
              }`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Secure details tag */}
          <div className="flex items-center justify-center gap-2 pt-2 text-[11px] font-semibold text-slate-400">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Handled via Apex Secure Checkout Gateway</span>
          </div>

        </div>

      </div>

      {/* 2. Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12 border-t border-slate-100 items-start">
        
        {/* Left Column: Overall Ratings breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 font-display">Customer Reviews</h3>
            <p className="text-xs text-slate-400">Overall rating feedback based on verified orders.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center bg-indigo-50 border border-indigo-100/50 p-6 rounded-2xl w-24 shrink-0">
              <span className="text-3xl font-extrabold text-indigo-700 block font-display leading-none">
                {product.ratingsAverage?.toFixed(1) || '0.0'}
              </span>
              <span className="text-[10px] font-bold text-indigo-500/80 mt-1 block">out of 5</span>
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.round(product.ratingsAverage || 0) ? 'currentColor' : 'none'}
                    className="stroke-amber-400"
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Combined total of {product.ratingsCount || 0} review{product.ratingsCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Write a review form (For customer role users) */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 font-display">Write a Review</h4>
            {user ? (
              user.role === 'customer' ? (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Stars input */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold select-none">Rating:</span>
                    <div className="flex gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewRating(star)}
                          className="hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Star
                            size={20}
                            fill={star <= newRating ? 'currentColor' : 'none'}
                            className="stroke-amber-400 cursor-pointer"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <Input
                    id="newComment"
                    label="Share your thoughts"
                    placeholder="Describe your user experience in detail..."
                    textarea
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={submittingReview}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full font-bold gap-2 py-2"
                    loading={submittingReview}
                  >
                    <Send size={14} />
                    <span>Submit Review</span>
                  </Button>
                </form>
              ) : (
                <p className="text-xs text-slate-400 bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  Reviews are limited to customer accounts. Seller and admin profiles cannot leave reviews.
                </p>
              )
            ) : (
              <div className="text-center py-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <p className="text-xs text-slate-500">Log in to your account to review this product.</p>
                <Link to="/login" className="inline-block">
                  <Button variant="secondary" size="sm" className="text-xs font-semibold py-1.5 px-3">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Reviews List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 font-display">Customer Comments</h3>
          
          {reviewsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-3xl">
              <p className="text-sm font-medium text-slate-400">This product hasn't been reviewed yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar Circle */}
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-semibold flex items-center justify-center text-sm font-display select-none">
                        {rev.customer?.name ? rev.customer.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{rev.customer?.name || 'Verified Buyer'}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {/* Stars */}
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                fill={i < rev.rating ? 'currentColor' : 'none'}
                                className="stroke-amber-400"
                              />
                            ))}
                          </div>
                          {rev.sentimentLabel && (
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold border uppercase rounded select-none ${getSentimentColor(rev.sentimentLabel)}`}>
                              {rev.sentimentLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Date and Moderation Actions */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                        <Calendar size={12} />
                        <span>{new Date(rev.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </span>
                      {user && user.role === 'admin' && (
                        <button
                          onClick={() => handleHideReview(rev._id)}
                          className="px-2 py-0.5 border border-rose-200 hover:border-rose-400 text-rose-600 hover:bg-rose-50/50 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Hide review from catalog"
                        >
                          <X size={10} />
                          <span>Hide Review</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Content comment */}
                  <p className="text-sm text-slate-600 leading-relaxed pl-12">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* 2. Related Products Recommendations Carousel */}
      <div className="border-t border-slate-100 pt-10 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-display text-slate-900">Recommended for You</h2>
          <p className="text-xs text-slate-400">Handpicked items matching your preferences from this category.</p>
        </div>

        {relatedLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-60 rounded-2xl" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : relatedProducts.length === 0 ? (
          <p className="text-xs text-slate-400 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            No related products found in this category currently.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ProductDetails;
