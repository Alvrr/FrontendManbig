import api from './axiosInstance';

export const listTransaksi = async () => {
  const res = await api.get('/transaksi');
  return res.data;
};

export const getTransaksiById = async (id) => {
  const res = await api.get(`/transaksi/${id}`);
  return res.data;
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
