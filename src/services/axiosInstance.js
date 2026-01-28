import axios from "axios";
import { getToken } from "./authAPI";

// Allow overriding API base URL via Vite env, fallback to deployed backend
const API_URL = import.meta.env.VITE_API_URL || "https://backendmanbig-production.up.railway.app";

const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
