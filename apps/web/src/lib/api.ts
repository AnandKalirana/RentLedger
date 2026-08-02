import axios, { AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// Falls back to localhost:4000 if NEXT_PUBLIC_API_URL is missing the origin
// (e.g. accidentally set to a relative path like "/api") — without this guard,
// stripping "/api" from "/api" collapses to "", and every "${apiOrigin}${path}"
// silently becomes a same-origin relative URL instead of pointing at the API.
const strippedOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
export const apiOrigin = strippedOrigin || "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends the httpOnly auth cookies set by the API
});

let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retried?: boolean }) | undefined;

    const isAuthError = error.response?.status === 401;
    const isAuthRoute = originalRequest?.url?.includes("/auth/login") || originalRequest?.url?.includes("/auth/refresh");

    // On a 401 from any route other than login/refresh itself, try refreshing
    // the access token once and retrying the original request. The access
    // token is short-lived (15 min) by design — this is what makes that
    // invisible to the user instead of logging them out every 15 minutes.
    if (isAuthError && !isAuthRoute && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true;
      try {
        // Multiple requests can 401 around the same time (e.g. a page firing
        // several calls at once) — share one in-flight refresh instead of
        // firing a refresh call per failed request.
        refreshPromise ??= api.post("/auth/refresh");
        await refreshPromise;
        refreshPromise = null;
        return api(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        // Refresh token is also invalid/expired — genuinely logged out.
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(new Error("Session expired. Please log in again."));
      }
    }

    const message = (error.response?.data as { message?: string } | undefined)?.message ?? "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);