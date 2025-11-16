import axiosInstance from "./axiosInstance";

export async function getAllDrivers() {
  try {
    const res = await axiosInstance.get("/auth/drivers");
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Gagal mengambil data driver" };
  }
}
