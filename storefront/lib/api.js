const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

// Simple fetch wrapper
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    console.log(`Making API request to: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`API response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API response data:', data);
    return data;

  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
};

// API functions
export const apiClient = {
  // Products
  getProducts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  // Homepage featured
  getHomepage: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/homepage${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  getProduct: async (id) => {
    return await apiRequest(`/products/${id}`);
  },

  getProductBySku: async (sku) => {
    return await apiRequest(`/products/sku/${sku}`);
  },

  // Categories
  getCategories: async () => {
    return await apiRequest('/categories');
  },

  getCategory: async (id) => {
    return await apiRequest(`/categories/${id}`);
  },

  // Auth
  login: async (credentials) => {
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData) => {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getProfile: async () => {
    return await apiRequest('/auth/profile');
  },

  updateProfile: async (userData) => {
    return await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Orders
  getOrders: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/orders${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  getOrder: async (id) => {
    return await apiRequest(`/orders/${id}`);
  },

  createOrder: async (orderData) => {
    return await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  cancelOrder: async (orderId) => {
    return await apiRequest(`/orders/${orderId}/cancel`, {
      method: 'PUT',
    });
  },

  // Admin
  getAdminStats: async () => {
    return await apiRequest('/admin/stats');
  },

  // Trigger refresh
  refreshNow: async (opts = {}) => {
    const isFull = opts.full ? '?full=true' : '';
    return await apiRequest(`/admin/refresh${isFull}`, { method: 'POST' });
  },

  getRefreshStatus: async () => {
    return await apiRequest('/admin/refresh/status');
  },

  getRefreshLogTail: async () => {
    return await apiRequest('/admin/refresh/log-tail');
  },

  getAdminOrders: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/orders${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  getAdminUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/users${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  createUser: async (userData) => {
    return await apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  updateUser: async (userId, userData) => {
    return await apiRequest(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  deleteUser: async (userId) => {
    return await apiRequest(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  },

  updateOrder: async (orderId, orderData) => {
    return await apiRequest(`/admin/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData)
    });
  },

  deleteOrder: async (orderId) => {
    return await apiRequest(`/admin/orders/${orderId}`, {
      method: 'DELETE'
    });
  },

  getOrderDetails: async (orderId) => {
    return await apiRequest(`/admin/orders/${orderId}`);
  },

  // Admin products by status
  getAdminProductsByStatus: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/products${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  // Feature toggles
  featureProduct: async (id) => apiRequest(`/admin/products/${id}/feature`, { method: 'POST' }),
  unfeatureProduct: async (id) => apiRequest(`/admin/products/${id}/unfeature`, { method: 'POST' }),
  bulkFeatureProducts: async (ids=[]) => apiRequest(`/admin/products/feature`, { method: 'POST', body: JSON.stringify({ ids }) }),
  bulkUnfeatureProducts: async (ids=[]) => apiRequest(`/admin/products/unfeature`, { method: 'POST', body: JSON.stringify({ ids }) }),

  reactivateProduct: async (id) => {
    return await apiRequest(`/admin/products/${id}/reactivate`, { method: 'POST' });
  },

  bulkReactivateProducts: async (ids = []) => {
    return await apiRequest(`/admin/products/reactivate`, { method: 'POST', body: JSON.stringify({ ids }) });
  },

  deactivateProduct: async (id) => {
    return await apiRequest(`/admin/products/${id}/deactivate`, { method: 'POST' });
  },

  bulkDeactivateProducts: async (ids = []) => {
    return await apiRequest(`/admin/products/deactivate`, { method: 'POST', body: JSON.stringify({ ids }) });
  },

  // Update order status (admin)
  updateOrderStatus: async (orderId, status) => {
    return await apiRequest(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Analytics
  getAnalyticsDashboard: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/analytics/dashboard${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },
};

// Utility functions
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(price);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default apiRequest;
