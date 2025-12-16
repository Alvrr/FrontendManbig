




import axiosInstance from "./axiosInstance";

export async function getAllPelanggan() {
  try {
    const res = await axiosInstance.get("/pelanggan");
    return res.data;
  } catch (err) {
    if (err?.response?.status === 403) {
      // Role tidak diizinkan
      return [];
    }
    // Hindari spam error; kembalikan [] supaya UI tetap jalan
    console.warn("Gagal ambil data pelanggan:", err?.response?.data || err.message);
    return [];
  }
}

export async function createPelanggan(data) {
  return axiosInstance.post("/pelanggan", data);
}

export async function updatePelanggan(id, data) {
  return axiosInstance.put(`/pelanggan/${id}`, data);
}

export async function deletePelanggan(id) {
  return axiosInstance.delete(`/pelanggan/${id}`);
}
