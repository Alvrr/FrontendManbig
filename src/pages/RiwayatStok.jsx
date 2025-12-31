import React, { useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/Card";
import axiosInstance from "../services/axiosInstance";
import { getSaldoProduk } from "../services/stokAPI";

const RiwayatStok = () => {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ produk_id: "", jenis: "", start: "", end: "" });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.produk_id) params.append("produk_id", filters.produk_id);
      if (filters.jenis) params.append("jenis", filters.jenis);
      if (filters.start) params.append("start", toRFC3339Start(filters.start));
      if (filters.end) params.append("end", toRFC3339End(filters.end));
      const res = await axiosInstance.get(`/stok/mutasi?${params.toString()}`);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.produk_id) params.append("produk_id", filters.produk_id);
      if (filters.jenis) params.append("jenis", filters.jenis);
      if (filters.start) params.append("start", toRFC3339Start(filters.start));
      if (filters.end) params.append("end", toRFC3339End(filters.end));
      const res = await axiosInstance.get(`/stok/mutasi/export?${params.toString()}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "riwayat_stok.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {}
  };

  useEffect(() => { fetchData(); }, []);

  const toRFC3339Start = (d) => `${d}T00:00:00Z`;
  const toRFC3339End = (d) => `${d}T23:59:59Z`;

  return (
    <PageWrapper
      title="Riwayat Stok"
      description="Lihat dan ekspor riwayat mutasi stok"
      action={
        <button onClick={exportExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Export Excel</button>
      }
    >
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">Produk ID</label>
            <input className="w-full input-glass px-3 py-2" value={filters.produk_id} onChange={e => setFilters({ ...filters, produk_id: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">Jenis</label>
            <select className="w-full input-glass px-3 py-2" value={filters.jenis} onChange={e => setFilters({ ...filters, jenis: e.target.value })}>
              <option value="">(semua)</option>
              <option value="masuk">masuk</option>
              <option value="keluar">keluar</option>
              <option value="adjust">adjust</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">Tanggal Mulai</label>
            <input type="date" className="w-full input-glass px-3 py-2" value={filters.start} onChange={e => setFilters({ ...filters, start: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">Tanggal Akhir</label>
            <input type="date" className="w-full input-glass px-3 py-2" value={filters.end} onChange={e => setFilters({ ...filters, end: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Terapkan</button>
          <button onClick={() => { setFilters({ produk_id: "", jenis: "", start: "", end: "" }); fetchData(); }} className="btn-secondary-glass px-4 py-2">Reset</button>
        </div>
        {loading ? <p>Memuat...</p> : (
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead className="thead-glass">
                <tr>
                  <th className="px-4 py-2">Tanggal</th>
                  <th className="px-4 py-2">Produk</th>
                  <th className="px-4 py-2">Jenis</th>
                  <th className="px-4 py-2">Jumlah</th>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Ref</th>
                  <th className="px-4 py-2">Keterangan</th>
                </tr>
              </thead>
              <tbody className="tbody-glass">
                {items.map((m, idx) => (
                  <tr key={idx} className="row-glass">
                    <td className="px-4 py-2 text-white/80">{m.created_at ? new Date(m.created_at).toLocaleString('id-ID') : '-'}</td>
                    <td className="px-4 py-2 text-white/90">{m.produk_id}</td>
                    <td className="px-4 py-2 text-white/90">{m.jenis}</td>
                    <td className="px-4 py-2 text-white/90">{m.jumlah}</td>
                    <td className="px-4 py-2 text-white/90">{m.user_id ? m.user_id : '-'}</td>
                    <td className="px-4 py-2 text-white/90">{(!m.ref_id || m.ref_type === 'manual') ? '-' : (m.ref_type ? `${m.ref_type}:${m.ref_id}` : m.ref_id)}</td>
                    <td className="px-4 py-2 text-white/90">{m.keterangan || '-'}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-white/70" colSpan={7}>Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageWrapper>
  );
};

export default RiwayatStok;
