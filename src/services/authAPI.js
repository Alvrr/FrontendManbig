import axios from "axios";

const API_URL = "http://localhost:5000";

export async function loginService({ email, password }) {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
    }
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Login gagal" };
  }
}

export async function registerService({ nama, email, password, role }) {
  try {
    const res = await axios.post(`${API_URL}/auth/register`, { nama, email, password, role });
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Registrasi gagal" };
  }
}

export function getToken() {
  return localStorage.getItem("token");
}

export function logoutService() {
  localStorage.removeItem("token");
}
