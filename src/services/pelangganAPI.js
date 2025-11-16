




import axiosInstance from "./axiosInstance";

export async function getAllPelanggan() {
  try {
    const res = await axiosInstance.get("/pelanggan");
    return res.data;
  } catch (err) {
    console.error("Gagal ambil data pelanggan:", err);
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
