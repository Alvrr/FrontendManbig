import React, { useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/Card";
import { getKategori, createKategori, updateKategori, deleteKategori } from "../services/kategoriAPI";
import { showSuccessAlert as showSuccess, showErrorAlert as showError, showConfirmAlert as showConfirm, showDeleteConfirmAlert as showDeleteConfirm } from "../utils/alertUtils";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";

const Kategori = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ nama_kategori: "", deskripsi: "" });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      const data = await getKategori();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      showError("Gagal memuat kategori");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.nama_kategori.trim()) return showError("Nama kategori wajib diisi");
    try {
      if (editing?.id) {
        await updateKategori(editing.id, { nama_kategori: form.nama_kategori, deskripsi: form.deskripsi });
        showSuccess("Kategori diperbarui");
      } else {
        await createKategori({ nama_kategori: form.nama_kategori, deskripsi: form.deskripsi });
        showSuccess("Kategori ditambahkan");
      }
      setForm({ nama_kategori: "", deskripsi: "" });
      setEditing(null);
      fetchData();
    } catch (e) {
      showError(e.response?.data?.message || "Operasi gagal");
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setForm({ nama_kategori: item.nama_kategori || "", deskripsi: item.deskripsi || "" });
  };

  const handleDelete = async (item) => {
    const res = await showDeleteConfirm(`Hapus Kategori`, `Anda akan menghapus kategori ${item.nama_kategori}. Tindakan ini tidak dapat dibatalkan.`);
    if (!res?.isConfirmed) return;
    try {
      await deleteKategori(item._id || item.id);
      showSuccess("Kategori dihapus");
      fetchData();
    } catch (e) {
      showError(e.response?.data?.message || "Gagal menghapus");
    }
  };
  const filtered = search ? list.filter(i => (i?.nama_kategori || '').toLowerCase().includes(search.toLowerCase())) : list;

  return (
    <PageWrapper
      title="Kategori"
      description="Kelola kategori produk"
      action={
        !editing && (
          <button onClick={() => setEditing({})} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            <span>Kategori Baru</span>
          </button>
        )
      }
    >
      <Card className="mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="w-5 h-5 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="input-glass w-full pl-10 pr-4 py-2"
              placeholder="Cari kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="table-glass min-w-full">
            <thead className="thead-glass">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Deskripsi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="tbody-glass">
              {filtered.map(item => (
                <tr key={item._id || item.id} className="row-glass">
                  <td className="px-4 py-3 text-white/90 align-top">{item.nama_kategori}</td>
                  <td className="px-4 py-3 text-white/80 align-top max-w-[480px]">
                    <span className="block truncate" title={item.deskripsi || ''}>{item.deskripsi || '-'}</span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(item)} className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded">Edit</button>
                      <button onClick={() => handleDelete(item)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-white/70" colSpan={3}>Tidak ada data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-glass backdrop-blur-md rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">{editing?.id ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="space-y-2">
                <input
                  className="input-glass w-full px-3 py-2"
                  placeholder="Nama kategori"
                  value={form.nama_kategori}
                  onChange={(e) => setForm({ ...form, nama_kategori: e.target.value })}
                />
                <textarea
                  className="input-glass w-full px-3 py-2"
                  placeholder="Deskripsi (opsional)"
                  rows={3}
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-2">
              <button onClick={() => { setEditing(null); setForm({ nama_kategori: "", deskripsi: "" }); }} className="btn-secondary-glass px-4 py-2">Batal</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Kategori;
