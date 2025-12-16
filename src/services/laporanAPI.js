import api from './axiosInstance';

export const getBestSellers = async (days = 7) => {
  try {
    const res = await api.get(`/laporan/best-sellers?days=${days}`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    if (err?.response?.status === 403) return [];
    return [];
  }
};
