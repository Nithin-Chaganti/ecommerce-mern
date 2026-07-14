
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  // Fetch Cart from Backend
  const fetchCart = useCallback(async () => {
    if (!user || user.role !== 'customer') {
      setCart({ items: [] });
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/cart');
      setCart(response.data.data || { items: [] });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      showToast('Could not load shopping cart', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  // Load cart when user logs in/changes
  useEffect(() => {
    fetchCart();
  }, [user, fetchCart]);

  // Add Item to Cart
  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      showToast('Please log in to add items to your cart', 'warning');
      return false;
    }
    if (user.role !== 'customer') {
      showToast('Only customer accounts can use the shopping cart', 'error');
      return false;
    }

    setLoading(true);
    try {
      const response = await api.post('/cart/items', { productId, quantity });
      setCart(response.data.data);
      showToast('Item added to cart successfully!', 'success');
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to add item to cart';
      showToast(errorMsg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update Item Quantity in Cart
  const updateQuantity = async (productId, quantity) => {
    if (!user || user.role !== 'customer') return false;

    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    setLoading(true);
    try {
      const response = await api.patch(`/cart/items/${productId}`, { quantity });
      setCart(response.data.data);
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update quantity';
      showToast(errorMsg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove Item from Cart
  const removeFromCart = async (productId) => {
    if (!user || user.role !== 'customer') return false;

    setLoading(true);
    try {
      const response = await api.delete(`/cart/items/${productId}`);
      setCart(response.data.data);
      showToast('Item removed from cart', 'info');
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to remove item';
      showToast(errorMsg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Clear Cart
  const clearCart = async () => {
    if (!user || user.role !== 'customer') return false;

    setLoading(true);
    try {
      const response = await api.delete('/cart');
      setCart(response.data.data || { items: [] });
      showToast('Cart cleared', 'info');
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to clear cart';
      showToast(errorMsg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
