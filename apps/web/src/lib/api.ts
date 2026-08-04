import axios, { AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");

export function resolveFileUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Attach Bearer token from localStorage as fallback for cross-domain requests
// where third-party httpOnly cookies may be blocked by browser policies.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => {
    // Automatically capture and store new accessToken if returned in response
    if (typeof window !== "undefined" && response.data?.data?.accessToken) {
      localStorage.setItem("accessToken", response.data.data.accessToken);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retried?: boolean }) | undefined;

    const isAuthError = error.response?.status === 401;
    const isAuthRoute =
      originalRequest?.url?.includes("/auth/login") || originalRequest?.url?.includes("/auth/refresh");

    // On a 401 from any route other than login/refresh itself, try refreshing the session
    if (isAuthError && !isAuthRoute && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true;
      try {
        refreshPromise ??= api.post("/auth/refresh");
        const refreshRes = (await refreshPromise) as { data?: { data?: { accessToken?: string } } };
        refreshPromise = null;

        const newToken = refreshRes?.data?.data?.accessToken;
        if (newToken && typeof window !== "undefined") {
          localStorage.setItem("accessToken", newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch {
        refreshPromise = null;
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          window.location.href = "/login";
        }
        return Promise.reject(new Error("Session expired. Please log in again."));
      }
    }

    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);