import axios from "axios";
import { useAuthStore } from "../store/authStore";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // For httpOnly cookies
  headers: {
    "Content-Type": "application/json"
  }
});
let isRefreshing = false;
let failedQueue = [];
function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = ["/auth/login", "/auth/register", "/auth/google"].some((route) => originalRequest.url?.includes(route));
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject
          });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = response.data;
        useAuthStore.getState().setAccessToken(accessToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.location.href = "/";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
function getErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    return data?.error?.message || error.message || "An unexpected error occurred";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}
export {
  api,
  getErrorMessage
};
