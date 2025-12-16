import React, { useEffect, useState } from 'react';
import { listPengiriman, updatePengiriman } from '../services/pengirimanAPI';
import { showTimedSuccessAlert, showErrorAlert, showConfirmAlert } from '../utils/alertUtils';
import { getTransaksiById } from '../services/transaksiAPI';
import { formatRupiah } from '../utils/currency';

export default function PengirimanDriver() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await listPengiriman();
      setItems(data);
    } catch (e) {
      showErrorAlert('Gagal memuat pengiriman');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpdateStatus = async (id, next) => {
    const res = await showConfirmAlert(`Ubah status jadi ${next}?`);
    const ok = res?.isConfirmed;
    if (!ok) return;
    try {
      await updatePengiriman(id, { status: next });
      showTimedSuccessAlert('Status diperbarui');
      load();
    } catch (e) {
      showErrorAlert('Gagal update status');
    }
  };

  const badge = (status) => {
    const map = {
      diproses: 'bg-yellow-100 text-yellow-800',
      dikirim: 'bg-blue-100 text-blue-800',
      selesai: 'bg-green-100 text-green-800',
      batal: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs rounded ${map[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const canUpdate = (current, next) => {
    if (!current) return true;
    if (current === 'selesai' || current === 'batal') return false;
    if (current === next) return false;
    return true;
  };

  const filtered = items.filter((p) => {
    const matchQuery = query.trim().length === 0 || (p.id || '').toLowerCase().includes(query.toLowerCase()) || (p.transaksi_id || '').toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === 'semua' || (p.status || '').toLowerCase() === statusFilter;
    return matchQuery && matchStatus;
  });


  const toggleDetail = async (p) => {
    const id = p.id;
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (details[id]) return;
    try {
      const trx = await getTransaksiById(p.transaksi_id);
      const items = Array.isArray(trx?.items) ? trx.items : [];
      setDetails(prev => ({ ...prev, [id]: { ...trx, items } }));
    } catch (e) {
      // ignore fetch error silently
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Pengiriman Saya</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm bg-gray-100 rounded border" onClick={load}>Refresh</button>
        </div>
      </div>
      <div className="flex gap-3 mb-4">
        <input className="border rounded px-3 py-2 flex-1" placeholder="Cari ID atau Transaksi" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="border rounded px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="semua">Semua Status</option>
          <option value="diproses">Diproses</option>
          <option value="dikirim">Dikirim</option>
          <option value="selesai">Selesai</option>
          <option value="batal">Batal</option>
        </select>
      </div>
      {loading ? (
        <p>Memuat...</p>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && <p>Tidak ada pengiriman.</p>}
          {filtered.map((p) => (
            <div key={p.id} className="border rounded p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.id}</div>
                  <div className="text-sm text-gray-600">Transaksi: {p.transaksi_id}</div>
                  <div className="text-sm">Jenis: {p.jenis || '-'}</div>
                  <div className="text-sm">Ongkir: {formatRupiah(p.ongkir || 0)}</div>
                  <div className="mt-1">{badge(p.status)}</div>
                </div>
                <div className="flex gap-2">
                <button disabled={!canUpdate(p.status, 'dikirim')} className={`px-3 py-1 text-sm rounded ${canUpdate(p.status, 'dikirim') ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`} onClick={() => handleUpdateStatus(p.id, 'dikirim')}>Kirim</button>
                <button disabled={!canUpdate(p.status, 'selesai')} className={`px-3 py-1 text-sm rounded ${canUpdate(p.status, 'selesai') ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`} onClick={() => handleUpdateStatus(p.id, 'selesai')}>Selesai</button>
                <button disabled={!canUpdate(p.status, 'batal')} className={`px-3 py-1 text-sm rounded ${canUpdate(p.status, 'batal') ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`} onClick={() => handleUpdateStatus(p.id, 'batal')}>Batal</button>
                  <button className="px-3 py-1 text-sm rounded bg-gray-100 border" onClick={() => toggleDetail(p)}>{expandedId === p.id ? 'Tutup' : 'Detail'}</button>
              </div>
              </div>
              {expandedId === p.id && (
                <div className="mt-3 bg-gray-50 border rounded p-3 text-sm">
                  {!details[p.id] ? (
                    <div className="text-gray-600">Memuat detail...</div>
                  ) : (
                    <div className="space-y-1">
                      <div><span className="font-medium">Pelanggan:</span> {details[p.id]?.pelanggan_id || '-'}</div>
                      <div><span className="font-medium">Total:</span> {formatRupiah(details[p.id]?.total || 0)}</div>
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
        </div>
      )}
    </div>
  );
}
