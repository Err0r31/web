import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  removeTokens,
  saveTokens,
} from "./auth";
import { showToast } from "./toast";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const publicEndpoints = [
      "banners/",
      "random-recommended/",
      "products/",
      "categories/",
      "product-stats/",
      "register/",
      "login/",
      "token/refresh/",
      "random-reviews/",
    ];
    const isPublic = publicEndpoints.some((endpoint) =>
      config.url.includes(endpoint)
    );
    if (!isPublic) {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("Sending token:", token);
      } else {
        console.log("No token found for protected endpoint:", config.url);
      }
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
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
      !originalRequest.url.includes("login/") &&
      !originalRequest.url.includes("refresh/")
    ) {
      originalRequest._retry = true;
      try {
        const refresh = getRefreshToken();
        if (!refresh) {
          throw new Error("No refresh token available");
        }
        console.log("Attempting to refresh token");
        const response = await axios.post(
          "http://127.0.0.1:8000/api/token/refresh/",
          { refresh },
          { withCredentials: true }
        );
        const newTokens = response.data;
        if (!newTokens.access || !newTokens.refresh) {
          throw new Error("Invalid refresh response");
        }
        saveTokens(newTokens);
        console.log("Token refreshed successfully");
        originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
        if (originalRequest.url.includes("cart/")) {
          const localCart = JSON.parse(localStorage.getItem("cart") || "{}");
          if (localCart.items?.length > 0) {
            for (const item of localCart.items) {
              await api.post("cart/", {
                variation_id: item.variation_id,
                quantity: item.quantity,
              });
            }
            localStorage.removeItem("cart");
          }
        }
        return api(originalRequest);
      } catch (refreshError) {
        console.error(
          "Token refresh failed:",
          refreshError.response?.data || refreshError
        );
        showToast("Сессия истекла, войдите заново", "error");
        removeTokens();
        return Promise.reject(refreshError);
      }
    }
    let message = "Произошла ошибка";
    if (error.response) {
      if (error.response.status === 401) {
        message = "Сессия истекла, войдите заново";
      } else if (error.response.status === 404) {
        message = "Ресурс не найден";
      } else if (error.response.status === 400) {
        message =
          error.response.data?.non_field_errors?.join(", ") ||
          error.response.data?.detail ||
          JSON.stringify(error.response.data);
      } else {
        message =
          error.response.data?.message || `Ошибка ${error.response.status}`;
      }
    }
    showToast(message, "error");
    console.error("API Error:", error.response?.data || error);
    return Promise.reject(error);
  }
);

export const getBanners = () => api.get("banners/").then((res) => res.data);

export const getRecommendedProducts = () =>
  api.get("random-recommended/").then((res) => res.data);
export const searchProducts = (query) =>
  api
    .get(`products/?search=${encodeURIComponent(query)}`)
    .then((res) => res.data);
export const getProduct = (id) =>
  api.get(`products/${id}/`).then((res) => res.data);

export const createProduct = (productData) =>
  api.post("admin/products/", productData).then((res) => res.data);
export const updateProduct = (id, productData) =>
  api.put(`admin/products/${id}/`, productData).then((res) => res.data);
export const deleteProduct = (id) =>
  api.delete(`admin/products/${id}/`).then((res) => res.data);
export const getCategories = () =>
  api.get("categories/").then((res) => res.data);

export const login = (username, password) =>
  api.post("login/", { username, password }).then((res) => {
    saveTokens(res.data);
    const localCart = JSON.parse(localStorage.getItem("cart") || "{}");
    console.log("Local cart before sync:", localCart);
    if (localCart.items?.length > 0) {
      return api
        .post("cart/merge/", { items: localCart.items })
        .then((res) => {
          console.log("Cart merged:", res.data);
          localStorage.setItem("cart", JSON.stringify(res.data));
          showToast("Корзина синхронизирована", "success");
          return res.data;
        })
        .catch((err) => {
          console.error("Cart merge failed:", err);
          showToast("Ошибка синхронизации корзины", "error");
          throw err;
        });
    }
    return res.data;
  });
export const register = (username, email, password, address, phone_number) =>
  api
    .post("register/", { username, email, password, address, phone_number })
    .then((res) => res.data);
export const logout = (refreshToken) =>
  api.post("logout/", { refresh: refreshToken }).then((res) => res.data);

export const addReview = (productId, reviewData) =>
  api
    .post(`products/${productId}/reviews/`, reviewData)
    .then((res) => res.data);
export const updateReview = (productId, reviewId, reviewData) =>
  api
    .put(`products/${productId}/reviews/${reviewId}/`, reviewData)
    .then((res) => res.data);
export const deleteReview = (productId, reviewId) =>
  api
    .delete(`products/${productId}/reviews/${reviewId}/`)
    .then((res) => res.data);
export const randomReview = () =>
  api.get("/random-reviews/").then((res) => res.data);

export const getOrders = () =>
  api.get("/admin/orders/").then((res) => res.data);
export const updateOrderStatus = (orderId, status) =>
  api
    .post(`/admin/orders/${orderId}/change_status/`, { status })
    .then((res) => res.data);
export const cancelOrder = (orderId) =>
  api.post(`/admin/orders/${orderId}/cancel/`).then((res) => res.data);

export const getUsers = () => api.get("/admin/users/").then((res) => res.data);
export const toggleUserBlock = (userId, isActive) =>
  api
    .patch(`/admin/users/${userId}/toggle_block/`, { is_active: isActive })
    .then((res) => res.data);
export const deleteUser = (userId) =>
  api.delete(`/admin/users/${userId}/`).then((res) => res.data);
export const toggleUserAdmin = (userId, isStaff) =>
  api
    .patch(`/admin/users/${userId}/toggle_admin/`, { is_staff: isStaff })
    .then((res) => res.data);

export const getCart = () => {
  const accessToken = getAccessToken();
  if (!accessToken) {
    const localCart = JSON.parse(localStorage.getItem("cart") || "{}");
    if (!localCart.items) {
      localCart.items = [];
      localCart.total_price = 0;
    }
    return Promise.resolve(localCart);
  }
  return api.get("cart/").then((res) => {
    console.log("Cart response:", res.data);
    localStorage.setItem("cart", JSON.stringify(res.data));
    return res.data;
  });
};

export const addToCart = async (variationId, quantity) => {
  console.log("Sending addToCart request:", {
    variation_id: variationId,
    quantity,
  });
  const accessToken = getAccessToken();
  let localCart = JSON.parse(localStorage.getItem("cart") || "{}");
  if (!localCart.items) {
    localCart = { items: [], total_price: 0 };
  }

  if (!accessToken) {
    const existingItem = localCart.items.find(
      (item) => item.variation_id === variationId
    );
    try {
      const variationData = await api
        .get(`variations/${variationId}/`)
        .then((res) => res.data);
      console.log("Variation data:", variationData);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        localCart.items.push({
          variation_id: variationId,
          quantity,
          variation: {
            id: variationData.id,
            size: variationData.size,
            color: variationData.color,
            stock: variationData.stock,
            product: {
              id: variationData.product.id,
              name: variationData.product.name,
              total_price: variationData.product.total_price,
              image: variationData.product.image
                ? variationData.product.image
                : null,
              brand: variationData.product.brand,
              price: variationData.product.price,
              discount: variationData.product.discount_percentage,
            },
          },
        });
      }
      localCart.total_price = localCart.items.reduce((total, item) => {
        return total + item.variation.product.total_price * item.quantity;
      }, 0);
      localStorage.setItem("cart", JSON.stringify(localCart));
      console.log("Local cart updated:", localCart);
      return localCart;
    } catch (err) {
      console.error("Failed to fetch variation data for local cart:", err);
      showToast("Ошибка добавления в корзину", "error");
      throw err;
    }
  }

  return api
    .post("cart/", { variation_id: variationId, quantity })
    .then((res) => {
      localStorage.setItem("cart", JSON.stringify(res.data));
      return res.data;
    });
};

export const updateCartItem = async (itemId, quantity) => {
  console.log("Updating cart item:", { itemId, quantity });
  const accessToken = getAccessToken();
  let localCart = JSON.parse(localStorage.getItem("cart") || "{}");
  if (!localCart.items) {
    localCart.items = [];
    localCart.total_price = 0;
  }

  if (!accessToken) {
    const item = localCart.items.find((item) => item.variation_id === itemId);
    if (item) {
      item.quantity = quantity;
      try {
        const variationData = await api
          .get(`variations/${itemId}/`)
          .then((res) => res.data);
        console.log("Variation data for update:", variationData);
        localCart.total_price = localCart.items.reduce((total, item) => {
          return total + item.variation.product.total_price * item.quantity;
        }, 0);
        localStorage.setItem("cart", JSON.stringify(localCart));
        console.log("Local cart updated:", localCart);
        return localCart;
      } catch (err) {
        console.error("Failed to fetch variation data for local cart:", err);
        showToast("Ошибка обновления корзины", "error");
        throw err;
      }
    }
    return localCart;
  }

  return api.put(`cart/${itemId}/`, { quantity }).then((res) => {
    localStorage.setItem("cart", JSON.stringify(res.data));
    return res.data;
  });
};

export const deleteCartItem = async (itemId) => {
  console.log("Deleting cart item:", itemId);
  const accessToken = getAccessToken();
  let localCart = JSON.parse(localStorage.getItem("cart") || "{}");
  if (!localCart.items) {
    localCart.items = [];
    localCart.total_price = 0;
  }

  if (!accessToken) {
    localCart.items = localCart.items.filter(
      (item) => item.variation_id !== itemId
    );
    try {
      if (localCart.items.length > 0) {
        const variationData = await api
          .get(`variations/${itemId}/`)
          .then((res) => res.data);
        console.log("Variation data for delete:", variationData);
        localCart.total_price = localCart.items.reduce((total, item) => {
          return total + item.variation.product.total_price * item.quantity;
        }, 0);
      } else {
        localCart.total_price = 0;
      }
      localStorage.setItem("cart", JSON.stringify(localCart));
      console.log("Local cart updated:", localCart);
      return localCart;
    } catch (err) {
      console.error("Failed to fetch variation data for local cart:", err);
      showToast("Ошибка удаления из корзины", "error");
      throw err;
    }
  }

  return api.delete(`cart/${itemId}/`).then((res) => {
    localStorage.setItem("cart", JSON.stringify(res.data));
    return res.data;
  });
};

export const clearCart = async () => {
  console.log("Clearing cart");
  const accessToken = getAccessToken();
  if (!accessToken) {
    localStorage.removeItem("cart");
    return { items: [], total_price: 0 };
  }
  return api.post("cart/clear/", {}).then((res) => {
    localStorage.setItem("cart", JSON.stringify(res.data));
    return res.data;
  });
};
