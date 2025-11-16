







import axiosInstance from "./axiosInstance";

export async function getAllProduk() {
  try {
    const res = await axiosInstance.get("/produk");
    return res.data;
  } catch (err) {
    console.error("Gagal ambil data produk:", err);
    return [];
  }
}

export const getProdukById = async (id) => {
  try {
    const response = await axiosInstance.get(`/produk/${id}`);
    return response.data;
  } catch (err) {
    console.error("Gagal ambil data produk berdasarkan ID:", err);
    return null;
  }
}

export async function createProduk(data) {
  return axiosInstance.post("/produk", data);
}

export async function updateProduk(id, data) {
  return axiosInstance.put(`/produk/${id}`, data);
}

export async function deleteProduk(id) {
  return axiosInstance.delete(`/produk/${id}`);
}
