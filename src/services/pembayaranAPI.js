
import axiosInstance from "./axiosInstance";

export async function getAllPembayaran() {
  try {
    const res = await axiosInstance.get("/pembayaran");
    return res.data;
  } catch (err) {
    if (err?.response?.status === 403) {
      // Role tidak diizinkan: kembalikan [] agar UI tetap berjalan
      return [];
    }
    console.error("Gagal ambil data pembayaran:", err);
    return [];
  }
}

export async function createPembayaran(data) {
  return axiosInstance.post("/pembayaran", data);
}

export async function updatePembayaran(id, data) {
  return axiosInstance.put(`/pembayaran/${id}`, data);
}

export async function deletePembayaran(id) {
  return axiosInstance.delete(`/pembayaran/${id}`);
}
