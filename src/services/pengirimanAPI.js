import api from './axiosInstance';

export const listPengiriman = async () => {
  try {
    const res = await api.get('/pengiriman');
    return res.data;
  } catch (err) {
    if (err?.response?.status === 403) {
      return [];
    }
    console.warn('Gagal ambil data pengiriman:', err?.response?.data || err.message);
    return [];
  }
};

export const getPengirimanById = async (id) => {
  const res = await api.get(`/pengiriman/${id}`);
  return res.data;
};

export const createPengiriman = async (payload) => {
  const res = await api.post('/pengiriman', payload);
  return res.data;
};

export const updatePengiriman = async (id, payload) => {
  const res = await api.put(`/pengiriman/${id}`, payload);
  return res.data;
};

export const deletePengiriman = async (id) => {
  const res = await api.delete(`/pengiriman/${id}`);
  return res.data;
};
