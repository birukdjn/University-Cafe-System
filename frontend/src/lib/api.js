import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cafe-api-f9re.onrender.com';

const api = axios.create({
  baseURL: API_URL,
});

// Attach access token
api.interceptors.request.use((config) => {
  // Skip token attachment during SSR
  if (typeof window === 'undefined') return config;
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh on 401
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  })
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If we're on the server, don't attempt refresh logic
    if (typeof window === 'undefined') return Promise.reject(error);

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axios(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      isRefreshing = true;
      const refresh = getRefreshToken();
      if (!refresh) {
        clearTokens();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_URL}/api/cafe/auth/token/refresh/`, { refresh });
        const newAccess = res.data.access;
        setTokens({ access: newAccess, refresh });
        processQueue(null, newAccess);
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccess;
        return axios(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearTokens();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
