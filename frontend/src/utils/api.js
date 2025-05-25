import axios from "axios";
import { getAccessToken, getRefreshToken, saveTokens } from "./auth";
import { showToast } from "./toast";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    // Список публичных эндпоинтов, не требующих токена
    const publicEndpoints = [
      'banners/',
      'random-recommended/',
      'products/',
      'categories/',
      'product-stats/',
      'register/',
      'login/',
      'token/refresh/',
    ];
    const isPublic = publicEndpoints.some((endpoint) =>
      config.url.includes(endpoint)
    );
    if (!isPublic) {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Sending token:', token); // Отладка
      } else {
        console.log('No token found for protected endpoint:', config.url); // Отладка
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('login/') &&
      !originalRequest.url.includes('refresh/')
    ) {
      originalRequest._retry = true;
      try {
        const refresh = getRefreshToken();
        if (!refresh) {
          throw new Error('No refresh token available');
        }
        const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
          refresh,
        });
        const newTokens = response.data;
        saveTokens(newTokens);
        originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        showToast('Сессия истекла, войдите заново', 'error');
        return Promise.reject(refreshError);
      }
    }
    let message = 'Произошла ошибка';
    if (error.response) {
      if (error.response.status === 401) {
        message = 'Ошибка авторизации: проверьте токен или войдите заново';
      } else if (error.response.status === 404) {
        message = 'Ресурс не найден';
      } else {
        message = error.response.data?.message || `Ошибка ${error.response.status}`;
      }
    }
    showToast(message, 'error');
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const getBanners = () => api.get("banners/").then((res) => res.data);
export const getRecommendedProducts = () =>
  api.get("random-recommended/").then((res) => res.data);
export const login = (username, password) =>
  api.post("login/", { username, password }).then((res) => res.data);
export const register = (username, email, password, address, phone_number) =>
  api
    .post("register/", { username, email, password, address, phone_number })
    .then((res) => res.data);
export const logout = (refreshToken) =>
  api.post("logout/", { refresh: refreshToken }).then((res) => res.data);
export const searchProducts = (query) =>
  api
    .get(`products/?search=${encodeURIComponent(query)}`)
    .then((res) => res.data);
