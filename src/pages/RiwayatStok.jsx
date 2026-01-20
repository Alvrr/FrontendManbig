import React, { useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/Card";
import axiosInstance from "../services/axiosInstance";
import { getSaldoProduk } from "../services/stokAPI";
import { getAllProduk } from "../services/produkAPI";
// Fitur ekspor Excel dihapus sesuai permintaan

const RiwayatStok = () => {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ produk_id: "", jenis: "", start: "", end: "" });
  const [loading, setLoading] = useState(false);
  const [produkMap, setProdukMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil((items?.length || 0) / itemsPerPage) || 1;

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
      setCurrentPage(1);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Ambil daftar produk untuk memetakan ID -> nama produk
  const fetchProdukMap = async () => {
    try {
      const list = await getAllProduk();
      const map = {};
      (Array.isArray(list) ? list : []).forEach(p => {
        const id = p.id || p._id || p.ID;
        const nama = p.nama_produk || p.nama || id;
        if (id) map[id] = nama;
      });
      setProdukMap(map);
    } catch (e) {
      setProdukMap({});
    }
  };

  // exportExcel dihapus

  useEffect(() => { fetchProdukMap(); fetchData(); }, []);

  const toRFC3339Start = (d) => `${d}T00:00:00Z`;
  const toRFC3339End = (d) => `${d}T23:59:59Z`;

  return (
    <PageWrapper
      title="Riwayat Stok"
      description="Lihat riwayat mutasi stok"
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
                {(items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)).map((m, idx) => (
                  <tr key={idx} className="row-glass">
                    <td className="px-4 py-2 text-white/80">{m.created_at ? new Date(m.created_at).toLocaleString('id-ID') : '-'}</td>
                    <td className="px-4 py-2 text-white/90">{produkMap[m.produk_id] || m.produk_nama || m.produk_id}</td>
                    <td className="px-4 py-2 text-white/90">{m.jenis}</td>
                    <td className="px-4 py-2 text-white/90">{m.jumlah}</td>
                    <td className="px-4 py-2 text-white/90">{m.user_id ? m.user_id : '-'}</td>
                    <td className="px-4 py-2 text-white/90">{(m.ref_type && m.ref_id) ? `${m.ref_type}:${m.ref_id}` : (m.ref_type || m.ref_id || '-')}</td>
                    <td className="px-4 py-2 text-white/90">{m.keterangan || '-'}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-white/70" colSpan={7}>Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
            {/* Pagination controls */}
            <div className="flex items-center justify-center mt-4">
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary-glass px-3 py-1"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >Previous</button>
                {/* Numbered pages */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={
                      (currentPage === page)
                        ? "px-3 py-1 rounded bg-blue-600 text-white shadow"
                        : "px-3 py-1 rounded btn-secondary-glass"
                    }
                  >{page}</button>
                ))}
                <button
                  className="btn-secondary-glass px-3 py-1"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >Next</button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </PageWrapper>
  );
};

export default RiwayatStok;
