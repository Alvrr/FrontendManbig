import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/Card";
import { createMutasi, getSaldoProduk } from "../services/stokAPI";
import { getAllProduk } from "../services/produkAPI";
import { showSuccessAlert as showSuccess, showErrorAlert as showError } from "../utils/alertUtils";
import { PlusIcon } from "@heroicons/react/24/outline";

const Stok = () => {
  const [list, setList] = useState([]); // list produk
  const [form, setForm] = useState({ produk_id: "", jenis: "masuk", jumlah: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const [produkList, setProdukList] = useState([]);
  const [produkQuery, setProdukQuery] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [lowThreshold, setLowThreshold] = useState(10);
  const [saldoMap, setSaldoMap] = useState({});
  const filteredProduk = produkList.filter(p => {
    const name = (p.nama_produk || p.nama || "").toLowerCase();
    return name.includes(produkQuery.toLowerCase());
  });

  const fetchData = async () => {
    try {
      const data = await getAllProduk();
      const arr = Array.isArray(data) ? data : [];
      setList(arr);
      // Ambil saldo terkini untuk setiap produk (parallel)
      const entries = await Promise.all(
        arr.map(async (p) => {
          try {
            const s = await getSaldoProduk(p.id);
            return [p.id, s?.saldo ?? p.stok ?? 0];
          } catch {
            return [p.id, p.stok ?? 0];
          }
        })
      );
      setSaldoMap(Object.fromEntries(entries));
    } catch (e) {
      showError("Gagal memuat data produk");
    }
  };

  const location = useLocation();

  useEffect(() => { 
    fetchData(); 
    (async () => {
      try {
        const data = await getAllProduk();
        setProdukList(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Gagal ambil produk:', e);
      }
    })();
    const params = new URLSearchParams(location.search);
    const low = params.get('low');
    const threshold = params.get('threshold');
    if (low === '1') setShowLowStock(true);
    if (threshold) setLowThreshold(Number(threshold) || 10);
  }, []);

  const handleSubmit = async () => {
    if (!form.produk_id || Number(form.jumlah) <= 0) return showError("Produk, jenis, dan jumlah wajib diisi");
    try {
      await createMutasi({ produk_id: form.produk_id, jenis: form.jenis, jumlah: Number(form.jumlah) });
      showSuccess("Mutasi stok berhasil");
      setForm({ produk_id: "", jenis: "masuk", jumlah: 0 });
      setShowPopup(false);
      fetchData();
    } catch (e) {
      showError(e.response?.data?.message || "Operasi gagal");
    }
  };

  const openAdjust = (produkId) => {
    setForm({ produk_id: produkId, jenis: "masuk", jumlah: 0 });
    setShowPopup(true);
  };
  return (
    <PageWrapper
      title="Stok"
      description="Kelola stok barang di gudang"
      action={
        <button onClick={() => setShowPopup(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          <span>Mutasi Stok</span>
        </button>
      }
    >
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Daftar Stok</h3>
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={showLowStock} onChange={(e) => setShowLowStock(e.target.checked)} />
                <span>Tampilkan stok rendah</span>
              </label>
              {showLowStock && (
                <input
                  type="number"
                  className="input-glass px-2 py-1 w-24"
                  value={lowThreshold}
                  min={1}
                  onChange={(e) => setLowThreshold(Number(e.target.value) || 1)}
                />
              )}
            </div>
            <ul className="divide-y">
              {(showLowStock ? list.filter(p => Number(saldoMap[p.id] ?? p.stok ?? 0) < lowThreshold) : list).map((p) => {
                const stokNow = Number(saldoMap[p.id] ?? p.stok ?? 0);
                const isLow = stokNow < lowThreshold;
                return (
                <li key={p.id} className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>{p.nama_produk || p.nama || p.id} • Stok: {stokNow}</span>
                    {isLow && (
                      <span className="badge badge-batal">Low</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openAdjust(p.id)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded">Adjust</button>
                  </div>
                </li>
              )})}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Info</h3>
            <p className="text-sm text-white/70">Gunakan tombol Adjust untuk melakukan mutasi stok (masuk/keluar/adjust).</p>
          </div>
        </div>
      </Card>
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-glass backdrop-blur-md shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Mutasi Stok</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="space-y-2">
                <input
                  className="w-full input-glass px-3 py-2"
                  placeholder="Cari produk..."
                  value={produkQuery}
                  onChange={(e) => setProdukQuery(e.target.value)}
                />
                <select
                  className="w-full input-glass px-3 py-2"
                  value={form.produk_id}
                  onChange={(e) => setForm({ ...form, produk_id: e.target.value })}
                >
                  <option value="">-- Pilih Produk --</option>
                  {filteredProduk.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama_produk || p.nama || p.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white/80">Jenis</label>
                  <select className="w-full input-glass px-3 py-2" value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value })}>
                    <option value="masuk">masuk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white/80">Jumlah</label>
                  <input type="number" min={1} className="w-full input-glass px-3 py-2" value={form.jumlah} onChange={e => setForm({ ...form, jumlah: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-2">
              <button className="btn-secondary-glass px-4 py-2" onClick={() => setShowPopup(false)}>Batal</button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded" onClick={handleSubmit}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Stok;
