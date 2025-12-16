import axiosInstance from './axiosInstance';

export const getKategori = async () => {
  const res = await axiosInstance.get('/kategori');
  return res.data;
};

export const getKategoriById = async (id) => {
  const res = await axiosInstance.get(`/kategori/${id}`);
  return res.data;
};

export const createKategori = async (data) => {
  const res = await axiosInstance.post('/kategori', data);
  return res.data;
};

export const updateKategori = async (id, data) => {
  const res = await axiosInstance.put(`/kategori/${id}`, data);
  return res.data;
};

export const deleteKategori = async (id) => {
  const res = await axiosInstance.delete(`/kategori/${id}`);
  return res.data;
};
