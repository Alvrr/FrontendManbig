import axiosInstance from './axiosInstance';

// Mutasi stok (admin, gudang)
export const createMutasi = async (payload) => {
  const res = await axiosInstance.post('/stok', payload);
  return res.data;
};

// Saldo stok per produk (view)
export const getSaldoProduk = async (produkId) => {
  const res = await axiosInstance.get(`/stok/saldo/${produkId}`);
  return res.data;
};

// Riwayat mutasi per produk (view)
export const getMutasiByProduk = async (produkId) => {
  const res = await axiosInstance.get(`/stok/mutasi/${produkId}`);
  return res.data;
};

export const listMutasi = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await axiosInstance.get(`/stok/mutasi${query ? `?${query}` : ''}`);
  return res.data;
};

export const exportMutasiExcel = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  // Always resolve to inspect status codes (e.g., 401/403)
  const res = await axiosInstance.get(
    `/stok/mutasi/export${query ? `?${query}` : ''}`,
    { responseType: 'arraybuffer', validateStatus: () => true }
  );
  return res;
};

// Backwards-compat exports (not used anymore)
export const getAllStok = async () => { throw new Error('Endpoint tidak tersedia. Gunakan getSaldoProduk per produk.'); };
export const updateStok = async () => { throw new Error('Endpoint tidak tersedia. Gunakan createMutasi untuk penyesuaian.'); };
export const deleteStok = async () => { throw new Error('Endpoint tidak tersedia.'); };
