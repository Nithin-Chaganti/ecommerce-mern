// Auth Context
import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch user profile after successful token retrieval
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    }
  };

  // Perform silent refresh on application mount
  const checkAuth = async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      const { accessToken } = response.data.data;
      setAccessToken(accessToken);
      await fetchUserProfile();
    } catch (error) {
      // Refresh token cookie not present or expired
      setUser(null);
      setAccessToken('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Attach global window hook for Axios interceptor updates
    window.__updateAuthToken = (newToken) => {
      setAccessToken(newToken);
    };

    window.__triggerLogout = () => {
      setUser(null);
      setAccessToken('');
    };

    return () => {
      delete window.__updateAuthToken;
      delete window.__triggerLogout;
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: loggedUser, accessToken } = response.data.data;
      setAccessToken(accessToken);
      setUser(loggedUser);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role, storeName) => {
    setLoading(true);
    try {
      // Build body; conditionally add storeName for sellers
      const payload = { name, email, password, role };
      if (role === 'seller' && storeName) {
        payload.storeName = storeName;
      }
      
      const response = await api.post('/auth/register', payload);
      // Backend registration returns safeUser. Some apps automatically login, 
      // but backend says "Registration successful. You can now log in." in response.
      // So we will prompt user to login, or we can login automatically if needed.
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Always clean local memory, even if backend request fails
      setAccessToken('');
      setUser(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
