import api from './axiosInstance';

export const listTransaksi = async () => {
  try {
    const res = await api.get('/transaksi');
    return res.data;
  } catch (err) {
    if (err?.response?.status === 403) {
      return [];
    }
    throw err;
  }
};

export const getTransaksiById = async (id) => {
  try {
    const res = await api.get(`/transaksi/${id}`);
    return res.data;
  } catch (err) {
    if (err?.response?.status === 403) {
      return null;
    }
    throw err;
  }
};

export const createTransaksi = async (payload) => {
  const res = await api.post('/transaksi', payload);
  return res.data;
};

export const updateTransaksi = async (id, payload) => {
  const res = await api.put(`/transaksi/${id}`, payload);
  return res.data;
};

export const deleteTransaksi = async (id) => {
  const res = await api.delete(`/transaksi/${id}`);
  return res.data;
};
