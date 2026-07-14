import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, Star } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import Button from '../components/common/Button';
import Skeleton from '../components/common/Skeleton';

const Wishlist = () => {
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    // Add to cart first
    const success = await addToCart(productId, 1);
    if (success) {
      // Remove from wishlist
      await removeFromWishlist(productId);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans space-y-6">
        <Skeleton className="h-8 w-1/4 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-56 rounded-2xl" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If empty
  if (!wishlist || !wishlist.products || wishlist.products.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6 font-sans">
        <div className="inline-flex items-center justify-center p-6 bg-rose-50 text-rose-500 rounded-full">
          <Heart size={48} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">Your Wishlist is Empty</h1>
        <p className="text-slate-500 max-w-sm mx-auto">
          Keep track of items you love. Click the heart icon on any product to save it here.
        </p>
        <Link to="/catalog">
          <Button variant="primary" size="lg" icon={ShoppingCart}>
            Explore Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">My Wishlist</h1>
        <p className="text-xs text-slate-400 mt-1">
          You have {wishlist.products.length} product{wishlist.products.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlist.products.map((product) => {
          if (!product) return null;

          const image = product.images && product.images.length > 0
            ? product.images[0]
            : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';

          return (
            <div
              key={product._id}
              className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
            >
              
              {/* Product Image Link */}
              <Link to={`/product/${product._id}`} className="relative block pt-[100%] overflow-hidden bg-slate-50 shrink-0">
                <img
                  src={image}
                  alt={product.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-550 ease-out"
                  loading="lazy"
                />

                {/* Remove button overlay */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFromWishlist(product._id);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 border border-slate-100 text-slate-400 hover:text-rose-600 transition-all hover:scale-105 active:scale-90 shadow-sm"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 size={16} />
                </button>
              </Link>

              {/* Product Info content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  
                  {/* Category */}
                  {product.category?.name && (
                    <span className="text-[10px] uppercase tracking-wider text-indigo-500 font-bold font-display">
                      {product.category.name}
                    </span>
                  )}

                  {/* Title */}
                  <Link to={`/product/${product._id}`} className="block">
                    <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
                      {product.title}
                    </h4>
                  </Link>

                  {/* Rating indicator */}
                  <div className="flex items-center gap-1">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          fill={i < Math.round(product.ratingsAverage || 0) ? 'currentColor' : 'none'}
                          className="stroke-amber-400"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {product.ratingsAverage?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>

                {/* Price and Add to Cart action */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 shrink-0">
                  <span className="text-base font-extrabold text-slate-900 font-display">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>

                  <Button
                    onClick={(e) => handleMoveToCart(e, product._id)}
                    variant="primary"
                    size="sm"
                    className="rounded-xl px-3 py-2 text-xs font-semibold gap-1.5 shadow-sm"
                  >
                    <ShoppingCart size={13} />
                    <span>Move to Cart</span>
                  </Button>
                </div>

              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;

