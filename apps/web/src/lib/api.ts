import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends the httpOnly auth cookies set by the API
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message ?? "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);
