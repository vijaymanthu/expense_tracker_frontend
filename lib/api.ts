import axios from "axios";
import { API_BASE_URL, API_URLS } from "@/lib/api-endpoints";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
  updateRefreshToken,
} from "@/lib/auth-storage";

type RetryableRequest = {
  _retry?: boolean;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequest & typeof error.config;
    const status = error.response?.status as number | undefined;

    if (status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await axios.post(
        `${API_BASE_URL}${API_URLS.AUTH_REFRESH}`,
        {
          refresh: refreshToken,
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      const nextAccessToken = (refreshResponse.data?.access ??
        refreshResponse.data?.access_token) as string | undefined;
      const nextRefreshToken = (refreshResponse.data?.refresh ??
        refreshResponse.data?.refresh_token) as string | undefined;
        
      if (!nextAccessToken) {
        clearAuthSession();
        return Promise.reject(error);
      }

      updateAccessToken(nextAccessToken);
      if (nextRefreshToken) {
        updateRefreshToken(nextRefreshToken);
      }
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearAuthSession();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    }
  },
);

export default api;
