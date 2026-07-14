// API service
import axios from 'axios';

// Get the API URL from environment variables or use a default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

let accessToken = '';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies (refresh token) with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to set token in memory
export const setAccessToken = (token) => {
  accessToken = token;
};

// Helper to get token
export const getAccessToken = () => {
  return accessToken;
};

// Request Interceptor: Attach the access token to every request
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle automatic token refreshing on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if refresh token call itself fails with 401
      if (originalRequest.url.includes('/auth/refresh-token') || originalRequest.url.includes('/auth/login')) {
        setAccessToken('');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request while waiting for the new token
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Request a new access token
        const response = await api.post('/auth/refresh-token');
        const { accessToken: newAccessToken } = response.data.data;
        
        setAccessToken(newAccessToken);
        
        // Notify AuthContext or update local reference
        if (window.__updateAuthToken) {
          window.__updateAuthToken(newAccessToken);
        }

        // Retry original request
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        setAccessToken('');
        // Trigger global logout event or handle cleanup
        if (window.__triggerLogout) {
          window.__triggerLogout();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
