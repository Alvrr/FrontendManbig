import React, { useEffect, useState } from 'react';
import PageWrapper from '../components/PageWrapper';
import Card from '../components/Card';
import { listTransaksi, updateTransaksi, deleteTransaksi, createTransaksi } from '../services/transaksiAPI';
import { getAllPelanggan } from '../services/pelangganAPI';
import { getKategori } from '../services/kategoriAPI';
import { getAllProduk } from '../services/produkAPI';
import { getSaldoProduk } from '../services/stokAPI';
import { showConfirmAlert, showTimedSuccessAlert, showErrorAlert } from '../utils/alertUtils';
import { formatRupiah } from '../utils/currency';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

export default function Transaksi() {
  const { authKey } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [form, setForm] = useState({ pelanggan_id: '', kategori_id: '', produk_id: '', jumlah: 1 });
  const [pelangganList, setPelangganList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [produkList, setProdukList] = useState([]);
  const [produkFiltered, setProdukFiltered] = useState([]);
  const [stokNow, setStokNow] = useState(0);
  const [cart, setCart] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listTransaksi();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    // IMPORTANT: reset state ketika user/token berubah (mencegah state terbawa antar user)
    setItems([]);
    setSearch('');
    setShowPopup(false);
    setForm({ pelanggan_id: '', kategori_id: '', produk_id: '', jumlah: 1 });
    setProdukFiltered([]);
    setStokNow(0);
    setCart([]);
    load();
    (async () => {
      try {
        const [pel, kat, prod] = await Promise.all([
          getAllPelanggan(),
          getKategori(),
          getAllProduk()
        ]);
        setPelangganList(Array.isArray(pel) ? pel : []);
        setKategoriList(Array.isArray(kat) ? kat : []);
        setProdukList(Array.isArray(prod) ? prod : []);
      } catch (e) {
        // ignore
      }
    })();
  }, [authKey]);

  useEffect(() => {
    if (!form.kategori_id) {
      setProdukFiltered(produkList);
    } else {
      setProdukFiltered(produkList.filter(p => p.kategori_id === form.kategori_id));
    }
  }, [form.kategori_id, produkList]);

  const selectedProduk = produkList.find(p => p.id === form.produk_id);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!form.produk_id) { setStokNow(0); return; }
      try {
        const s = await getSaldoProduk(form.produk_id);
        if (active) setStokNow(Number(s?.saldo ?? selectedProduk?.stok ?? 0));
      } catch {
        if (active) setStokNow(Number(selectedProduk?.stok ?? 0));
      }
    };
    run();
    return () => { active = false; };
  }, [form.produk_id, selectedProduk]);

  const activeItems = items.filter(i => (i?.status || '').toLowerCase() !== 'selesai');
  const dataToDisplay = (search ? activeItems.filter(i => i?.id?.toLowerCase().includes(search.toLowerCase())) : activeItems);

  const handleUpdateStatus = async (id, status) => {
    const res = await showConfirmAlert('Update Status', `Ubah status transaksi menjadi ${status}?`, 'Ya', 'Batal');
    if (!res?.isConfirmed) return;
    try {
      await updateTransaksi(id, { status });
      showTimedSuccessAlert('Status transaksi diperbarui');
      load();
    } catch (e) {
      showErrorAlert('Gagal update status');
    }
  };

  const handleDelete = async (id) => {
    const res = await showConfirmAlert('Hapus Transaksi', 'Yakin hapus transaksi ini?', 'Ya, Hapus', 'Batal');
    if (!res?.isConfirmed) return;
    try {
      await deleteTransaksi(id);
      showTimedSuccessAlert('Transaksi dihapus');
      load();
    } catch (e) {
      showErrorAlert('Gagal menghapus transaksi');
    }
  };

  const addToCart = () => {
    if (!form.produk_id || Number(form.jumlah) <= 0) return showErrorAlert('Pilih produk dan jumlah valid');
    const stok = Number(stokNow ?? 0);
    if (form.jumlah > stok) return showErrorAlert('Jumlah melebihi stok tersedia');
    const item = {
      produk_id: form.produk_id,
      nama_produk: selectedProduk?.nama_produk || selectedProduk?.nama || form.produk_id,
      jumlah: Number(form.jumlah)
    };
    setCart(prev => [...prev, item]);
    setForm({ ...form, produk_id: '', jumlah: 1 });
  };

  const resetCart = () => setCart([]);

  const handleCreate = async () => {
    if (!form.pelanggan_id || cart.length === 0) return showErrorAlert('Pelanggan dan item wajib diisi');
    try {
      await createTransaksi({
        pelanggan_id: form.pelanggan_id,
        items: cart.map(i => ({ produk_id: i.produk_id, jumlah: i.jumlah }))
      });
      showTimedSuccessAlert('Transaksi dibuat');
      setShowPopup(false);
      setForm({ pelanggan_id: '', kategori_id: '', produk_id: '', jumlah: 1 });
      setCart([]);
      load();
    } catch (e) {
      showErrorAlert(e?.response?.data?.message || 'Gagal membuat transaksi');
    }
  };

  // gunakan util bersama

  return (
    <PageWrapper
      title="Transaksi"
      description="Daftar transaksi kasir"
      action={
        <button onClick={() => setShowPopup(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          <span>Transaksi Baru</span>
        </button>
      }
    >
      <Card className="mb-4">
        <div className="flex gap-3">
          <input className="input-glass px-3 py-2 flex-1" placeholder="Cari ID transaksi" value={search} onChange={e => setSearch(e.target.value)} />
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={load}>Refresh</button>
        </div>
      </Card>
      <Card>
        {loading ? <p>Memuat...</p> : (
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead className="thead-glass">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Pelanggan</th>
                  <th className="px-4 py-2 text-left">Total Produk</th>
                  <th className="px-4 py-2 text-left">Total Harga</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Tanggal</th>
                  <th className="px-4 py-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="tbody-glass">
                {dataToDisplay.map(t => (
                  <tr key={t.id} className="row-glass">
                    <td className="px-4 py-2 text-white/90">{t.id}</td>
                    <td className="px-4 py-2 text-white/90">{t.pelanggan_id}</td>
                    <td className="px-4 py-2 text-white/90">{t.total_produk}</td>
                    <td className="px-4 py-2 text-white/90">{formatRupiah(t.total_harga)}</td>
                    <td className="px-4 py-2 text-white/90">{t.status}</td>
                    <td className="px-4 py-2 text-white/80">{t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : '-'}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-sm bg-red-600 text-white rounded" onClick={() => handleDelete(t.id)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {dataToDisplay.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-white/70" colSpan={7}>Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-glass backdrop-blur-md shadow-xl w-full max-w-3xl">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Buat Transaksi</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white/80">Pelanggan</label>
                  <select className="w-full input-glass px-3 py-2" value={form.pelanggan_id} onChange={e => setForm({ ...form, pelanggan_id: e.target.value })}>
                    <option value="">-- Pilih Pelanggan --</option>
                    {pelangganList.map(p => (
                      <option key={p.id} value={p.id}>{p.nama || p.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white/80">Kategori</label>
                  <select className="w-full input-glass px-3 py-2" value={form.kategori_id} onChange={e => setForm({ ...form, kategori_id: e.target.value })}>
                    <option value="">-- Pilih Kategori --</option>
                    {kategoriList.map(k => (
                      <option key={k._id || k.id} value={k._id || k.id}>{k.nama_kategori || k.nama}</option>
                    ))}
                  </select>
                </div>
                {/* Status tidak diinput; mengikuti alur otomatis */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-white/80">Produk</label>
                  <select className="w-full input-glass px-3 py-2" value={form.produk_id} onChange={e => setForm({ ...form, produk_id: e.target.value })}>
                    <option value="">-- Pilih Produk --</option>
                    {produkFiltered.map(p => (
                      <option key={p.id} value={p.id}>{p.nama_produk || p.nama || p.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white/80">Stok</label>
                  <input className="w-full input-glass px-3 py-2 opacity-80" value={stokNow} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white/80">Jumlah</label>
                  <input type="number" min={1} className="w-full input-glass px-3 py-2" value={form.jumlah} onChange={e => setForm({ ...form, jumlah: Number(e.target.value) })} />
                </div>
                <div>
                  <button onClick={addToCart} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Tambah</button>
                </div>
              </div>

              <Card>
                <div className="overflow-x-auto">
                  <table className="table-glass">
                    <thead className="thead-glass">
                      <tr>
                        <th className="px-4 py-2 text-left">Produk</th>
                        <th className="px-4 py-2 text-left">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="tbody-glass">
                      {cart.map((i, idx) => (
                        <tr key={idx} className="row-glass">
                          <td className="px-4 py-2 text-white/90">{i.nama_produk}</td>
                          <td className="px-4 py-2 text-white/90">{i.jumlah}</td>
                        </tr>
                      ))}
                      {cart.length === 0 && (
                        <tr><td className="px-4 py-4 text-center text-white/70" colSpan={2}>Belum ada item</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button className="btn-secondary-glass px-4 py-2" onClick={() => { setShowPopup(false); resetCart(); }}>Batal</button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" onClick={handleCreate}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
