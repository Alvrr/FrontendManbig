export const formatRupiah = (value) => {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);
};
