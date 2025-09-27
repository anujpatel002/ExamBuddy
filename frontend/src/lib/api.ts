import axios from 'axios';

const api = axios.create({
  // Use the environment variable, or a local default for development
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const userInfoString = localStorage.getItem('userInfo');
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo && userInfo.token) {
          config.headers.Authorization = `Bearer ${userInfo.token}`;
        }
      }
    } catch (error) {
      console.error('Error parsing user info from localStorage:', error);
      localStorage.removeItem('userInfo');
    }
  }
  return config;
});

export default api;