import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import Button from '../common/Button';

const ProductCard = ({ product }) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();

  const isWishlisted = isInWishlist(product._id);

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      await removeFromWishlist(product._id);
    } else {
      await addToWishlist(product._id);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product._id, 1);
  };

  // Calculate pricing
  const originalPrice = product.price;
  const discountPercent = product.discountPercent || 0;
  const discountedPrice = discountPercent > 0 
    ? Math.round(originalPrice * (1 - discountPercent / 100))
    : originalPrice;

  // Get main image or fallback
  const mainImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'; // fall back to nice shoe image

  return (
    <div className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full font-sans">
      
      {/* Product Image & Badges */}
      <Link to={`/product/${product._id}`} className="relative block pt-[100%] overflow-hidden bg-slate-50 shrink-0">
        <img
          src={mainImage}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-sm select-none">
            {discountPercent}% OFF
          </span>
        )}

        {/* Wishlist Button Overlay */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md border transition-all active:scale-90 ${
            isWishlisted
              ? 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100'
              : 'bg-white/80 border-white/40 text-slate-400 hover:text-rose-500 hover:bg-white'
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </Link>

      {/* Card Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Category/Tags */}
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

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  fill={i < Math.round(product.ratingsAverage || 0) ? "currentColor" : "none"}
                  className="stroke-amber-400"
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              {product.ratingsAverage?.toFixed(1) || '0.0'}
            </span>
            <span className="text-[10px] text-slate-400">
              ({product.ratingsCount || 0})
            </span>
          </div>
        </div>

        {/* Price & Add to Cart Action */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 shrink-0">
          <div className="flex flex-col">
            {discountPercent > 0 && (
              <span className="text-[11px] text-slate-400 line-through font-medium">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
            )}
            <span className="text-base font-extrabold text-slate-900 font-display">
              ₹{discountedPrice.toLocaleString('en-IN')}
            </span>
          </div>

          <Button
            onClick={handleAddToCart}
            variant={product.stock > 0 ? "primary" : "secondary"}
            size="sm"
            disabled={product.stock <= 0}
            className="rounded-xl px-3 py-2 text-xs font-semibold gap-1.5 shadow-sm"
          >
            <ShoppingCart size={14} />
            <span>{product.stock > 0 ? 'Add' : 'Out of Stock'}</span>
          </Button>
        </div>

      </div>

    </div>
  );
};

export default ProductCard;
