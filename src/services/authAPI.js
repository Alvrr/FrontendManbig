import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://backendmanbig-production.up.railway.app";

export async function loginService({ email, password }) {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      // IMPORTANT: notify app to refresh auth-dependent UI/state
      window.dispatchEvent(new Event('auth:changed'));
    }
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Login gagal";
    throw { message: msg };
  }
}

export async function registerService({ nama, email, password, role }) {
  try {
    const res = await axios.post(`${API_URL}/auth/register`, { nama, email, password, role });
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Registrasi gagal";
    throw { message: msg };
  }
}

export function getToken() {
  return localStorage.getItem("token");
}

export function logoutService() {
  localStorage.removeItem("token");
  // IMPORTANT: notify app to reset per-user state
  window.dispatchEvent(new Event('auth:changed'));
}
