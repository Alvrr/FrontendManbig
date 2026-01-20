import React, { useEffect, useState } from 'react';
import { listPengiriman, updatePengiriman, getPengirimanById } from '../services/pengirimanAPI';
import { showTimedSuccessAlert, showErrorAlert, showConfirmAlert, showInputAlert } from '../utils/alertUtils';
import { getAllDrivers } from '../services/driverAPI';
import { useAuth } from '../hooks/useAuth';

export default function PengirimanDriver() {
  const { user: authUser, authKey } = useAuth();
  const isDriver = authUser?.role === 'driver';
  const isReadOnly = !isDriver;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({});
  const [driverNamaMap, setDriverNamaMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const load = async () => {
    setLoading(true);
    try {
      const data = await listPengiriman();
      setItems(Array.isArray(data) ? data : []);
      setCurrentPage(1);
      // Enrich: fetch driver list to map driver_id -> nama
      try {
        const driverData = await getAllDrivers();
        const arr = Array.isArray(driverData) ? driverData : (driverData?.data || []);
        const mapObj = {};
        arr.forEach(d => {
          const id = d?.id || d?._id || d?.ID || d?.username;
          const nama = d?.nama || d?.name || d?.username || id;
          if (id) mapObj[id] = nama;
        });
        setDriverNamaMap(mapObj);
      } catch {
        // ignore
      }
    } catch (e) {
      showErrorAlert('Gagal memuat pengiriman');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // IMPORTANT: reset state ketika user/token berubah (mencegah state terbawa antar user)
    setItems([]);
    setQuery("");
    setStatusFilter("semua");
    setExpandedId(null);
    setDetails({});
    setDriverNamaMap({});
    setCurrentPage(1);
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authKey]);
  useEffect(() => { setCurrentPage(1); }, [query, statusFilter]);

  const handleUpdateStatus = async (p, next) => {
    if (!isDriver) {
      showErrorAlert('Halaman Pengiriman bersifat read-only untuk selain driver');
      return;
    }

    // Defense-in-depth: driver hanya boleh update miliknya sendiri
    if (p?.driver_id && authUser?.id && String(p.driver_id) !== String(authUser.id)) {
      showErrorAlert('Forbidden: pengiriman bukan milik Anda');
      return;
    }
    // Normalisasi label yang ditampilkan
    const label = next === 'dikirim' ? 'Sedang Diantarkan' : (next === 'sedang diantarkan' ? 'Sedang Diantarkan' : next);
    const res = await showConfirmAlert(`Ubah status jadi ${label}?`);
    const ok = res?.isConfirmed;
    if (!ok) return;
    try {
      // Jika batal, minta alasan
      let payload = { status: next };
      if (next === 'batal') {
        const input = await showInputAlert('Alasan Pembatalan', 'Masukkan alasan pembatalan', '');
        const reason = input?.value?.trim();
        if (!reason) {
          showErrorAlert('Alasan batal wajib diisi');
          return;
        }
        payload = { status: next, alasan_batal: reason };
      }
      await updatePengiriman(p.id, payload);
      showTimedSuccessAlert('Status diperbarui');
      load();
    } catch (e) {
      showErrorAlert('Gagal update status');
    }
  };

  const badge = (status) => {
    const key = String(status || '').toLowerCase();
    const cls =
      key === 'diproses' ? 'badge badge-proses' :
      key === 'dikirim' || key === 'sedang diantarkan' ? 'badge badge-dikirim' :
      key === 'selesai' ? 'badge badge-selesai' :
      key === 'batal' ? 'badge badge-batal' : 'badge border-white/10 text-white/80 bg-white/10';
    return <span className={cls}>{status}</span>;
  };

  const canUpdate = (current, next) => {
    if (!current) return true;
    if (current === 'selesai' || current === 'batal') return false;
    if (current === next) return false;
    return true;
  };

  const filtered = items.filter((p) => {
    const q = query.toLowerCase().trim();
    const driverNama = driverNamaMap[p.driver_id] || '';
    const matchQuery = q.length === 0 
      || (p.id || '').toLowerCase().includes(q) 
      || (p.transaksi_id || '').toLowerCase().includes(q)
      || (p.driver_id || '').toLowerCase().includes(q)
      || driverNama.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'semua' || (p.status || '').toLowerCase() === statusFilter;
    return matchQuery && matchStatus;
  });
  const totalPages = Math.ceil((filtered?.length || 0) / itemsPerPage) || 1;
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  const toggleDetail = async (p) => {
    const id = p.id;
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (details[id]) return;
    try {
      const detail = await getPengirimanById(id);
      setDetails(prev => ({ ...prev, [id]: detail || {} }));
    } catch (e) {
      // ignore fetch error silently
    }
  };

  return (
    <div className="p-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <span>{isDriver ? 'Pengiriman Saya' : 'Daftar Pengiriman'}</span>
          {isReadOnly && (
            <span className="text-xs px-2 py-1 rounded border border-white/20 bg-white/10 text-white/80">Read Only</span>
          )}
        </h1>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm rounded border border-white/20 bg-white/10 hover:bg-white/20 transition" onClick={load}>Refresh</button>
        </div>
      </div>
      <div className="flex gap-3 mb-4">
        <input className="input-glass px-3 py-2 flex-1" placeholder="Cari ID, Transaksi, atau Driver" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="input-glass px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="semua">Semua Status</option>
          <option value="diproses">Diproses</option>
          <option value="sedang diantarkan">Sedang Diantarkan</option>
          <option value="selesai">Selesai</option>
          <option value="batal">Batal</option>
        </select>
      </div>
      {loading ? (
        <p className="text-white/80">Memuat...</p>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-white/80">Tidak ada pengiriman.</p>}
          {paged.map((p) => (
            <div key={p.id} className="border border-white/20 bg-white/5 rounded p-3 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.id}</div>
                  <div className="text-sm text-white/80">Transaksi: {p.transaksi_id}</div>
                  <div className="text-sm text-white/80">Driver: {driverNamaMap[p.driver_id] ? `${driverNamaMap[p.driver_id]} (${p.driver_id})` : (p.driver_id || '-')}</div>
                  <div className="text-sm text-white/90">Jenis: {p.jenis || '-'}</div>
                  <div className="mt-1">{badge(p.status)}</div>
                </div>
                <div className="flex gap-2">
                  {isDriver && (
                    <>
                      <button disabled={!canUpdate(p.status, 'sedang diantarkan')} className={`px-3 py-1 text-sm rounded ${canUpdate(p.status, 'sedang diantarkan') ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/50 border border-white/10 cursor-not-allowed'}`} onClick={() => handleUpdateStatus(p, 'sedang diantarkan')}>Kirim</button>
                      <button disabled={!canUpdate(p.status, 'selesai')} className={`px-3 py-1 text-sm rounded ${canUpdate(p.status, 'selesai') ? 'bg-green-600 text-white' : 'bg-white/10 text-white/50 border border-white/10 cursor-not-allowed'}`} onClick={() => handleUpdateStatus(p, 'selesai')}>Selesai</button>
                      <button disabled={!canUpdate(p.status, 'batal')} className={`px-3 py-1 text-sm rounded ${canUpdate(p.status, 'batal') ? 'bg-red-600 text-white' : 'bg-white/10 text-white/50 border border-white/10 cursor-not-allowed'}`} onClick={() => handleUpdateStatus(p, 'batal')}>Batal</button>
                    </>
                  )}
                  <button className="px-3 py-1 text-sm rounded border border-white/20 bg-white/10 hover:bg-white/20 transition" onClick={() => toggleDetail(p)}>{expandedId === p.id ? 'Tutup' : 'Detail'}</button>
              </div>
              </div>
              {expandedId === p.id && (
                <div className="mt-3 bg-white/5 border border-white/20 rounded p-3 text-sm text-white/90">
                  {!details[p.id] ? (
                    <div className="text-white/80">Memuat detail...</div>
                  ) : (
                    <div className="space-y-1">
                      <div><span className="font-medium">Pelanggan:</span> {details[p.id]?.pelanggan_nama || details[p.id]?.pelanggan_id || '-'}</div>
                      {(String(p.status || '').toLowerCase() === 'batal' || details[p.id]?.alasan_batal) && (
                        <div><span className="font-medium">Alasan Batal:</span> {details[p.id]?.alasan_batal || '-'}</div>
                      )}
                        <div className="font-medium">Item:</div>
                        <ul className="list-disc pl-5">
                          {(Array.isArray(details[p.id]?.items) ? details[p.id].items : []).map((it, idx) => (
                            <li key={idx}>{it.nama_produk || it.produk_id} × {it.jumlah}</li>
                          ))}
                        </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {/* Pagination */}
          {filtered.length > itemsPerPage && (
            <div className="flex items-center justify-center mt-4">
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary-glass px-3 py-1"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >Previous</button>
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
          )}
        </div>
      )}
    </div>
  );
}
