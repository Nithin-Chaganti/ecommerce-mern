import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [wishlist, setWishlist] = useState({ products: [] });
  const [loading, setLoading] = useState(false);

  // Fetch Wishlist from Backend
  const fetchWishlist = useCallback(async () => {
    if (!user || user.role !== 'customer') {
      setWishlist({ products: [] });
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/wishlist');
      setWishlist(response.data.data || { products: [] });
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      showToast('Could not load wishlist', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  // Load wishlist when user changes
  useEffect(() => {
    fetchWishlist();
  }, [user, fetchWishlist]);

  // Add Product to Wishlist
  const addToWishlist = async (productId) => {
    if (!user) {
      showToast('Please log in to add items to your wishlist', 'warning');
      return false;
    }
    if (user.role !== 'customer') {
      showToast('Only customer accounts can use the wishlist', 'error');
      return false;
    }

    setLoading(true);
    try {
      await api.post('/wishlist', { productId });
      showToast('Item added to wishlist!', 'success');
      // Re-fetch to get populated products details
      await fetchWishlist();
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to add item to wishlist';
      showToast(errorMsg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove Product from Wishlist
  const removeFromWishlist = async (productId) => {
    if (!user || user.role !== 'customer') return false;

    setLoading(true);
    try {
      await api.delete(`/wishlist/${productId}`);
      showToast('Item removed from wishlist', 'info');
      // Re-fetch to update local state
      await fetchWishlist();
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to remove item';
      showToast(errorMsg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check if product is in Wishlist
  const isInWishlist = useCallback((productId) => {
    if (!wishlist?.products) return false;
    return wishlist.products.some((product) => {
      const id = typeof product === 'object' ? product._id : product;
      return id === productId;
    });
  }, [wishlist]);

  const value = {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refreshWishlist: fetchWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

