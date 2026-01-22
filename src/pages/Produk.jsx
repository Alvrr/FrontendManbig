import { useEffect, useState } from "react"
import {
  getAllProduk,
  createProduk,
  updateProduk,
  deleteProduk,
} from "../services/produkAPI"
import { 
  showWarningAlert,
  showErrorAlert,
  showConfirmAlert,
  showSuccessAlert,
} from "../utils/alertUtils"
import PageWrapper from "../components/PageWrapper"
import Card from "../components/Card"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { useAuth } from "../hooks/useAuth"
import { formatRupiah } from "../utils/currency"
import { getKategori } from "../services/kategoriAPI"
import { getSaldoProduk } from "../services/stokAPI"

const Produk = () => {
  const [produk, setProduk] = useState([])
  const { user: authUser, authKey } = useAuth()
  const [searchId, setSearchId] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [kategori, setKategori] = useState([])
  const [saldoMap, setSaldoMap] = useState({})
  const [form, setForm] = useState({
    nama_produk: "",
    kategori_id: "",
    harga_jual: "",
    harga_beli: "",
    deskripsi: "",
    tanggal: "",
  })
  const [isEdit, setIsEdit] = useState(false)
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const role = authUser?.role || ""
  const canManageProduk = role === "gudang"
  const isReadOnly = !canManageProduk

  const formatIDRInput = (v) => {
    const digits = String(v ?? "").replace(/\D/g, "")
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  const fetchData = async () => {
    const [dataProduk, dataKategori] = await Promise.all([
      getAllProduk(),
      getKategori(),
    ])
    setProduk(Array.isArray(dataProduk) ? dataProduk : [])
    setKategori(Array.isArray(dataKategori) ? dataKategori : [])
    // ambil saldo per produk untuk stok terkini
    const entries = await Promise.all(
      (Array.isArray(dataProduk) ? dataProduk : []).map(async (p) => {
        try {
          const s = await getSaldoProduk(p.id)
          return [p.id, s?.saldo ?? p.stok ?? 0]
        } catch {
          return [p.id, p.stok ?? 0]
        }
      })
    )
    setSaldoMap(Object.fromEntries(entries))
  }

  useEffect(() => {
    // IMPORTANT: reset state ketika user/token berubah (mencegah state terbawa antar user)
    setProduk([])
    setKategori([])
    setSaldoMap({})
    setSearchId("")
    setModalOpen(false)
    setIsEdit(false)
    setSelectedId("")
    setCurrentPage(1)
    fetchData()
  }, [authKey])

  const openModal = (item = null, mode = 'edit') => {
    if (mode !== 'view' && isReadOnly) {
      showWarningAlert("Akses Ditolak", "Role Anda hanya bisa melihat data produk")
      return
    }
    if (item) {
      setForm({
        id: item.id,
        nama_produk: item.nama_produk || "",
        kategori_id: item.kategori_id || "",
        harga_jual: item.harga_jual !== undefined && item.harga_jual !== null ? formatIDRInput(String(item.harga_jual)) : "",
        harga_beli: item.harga_beli !== undefined && item.harga_beli !== null ? formatIDRInput(String(item.harga_beli)) : "",
        deskripsi: item.deskripsi || "",
        tanggal: item.created_at ? new Date(item.created_at).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
      })
      setSelectedId(item.id)
      setIsEdit(mode === 'edit')
      setIsViewOnly(mode === 'view')
    } else {
      setForm({
        nama_produk: "",
        kategori_id: "",
        harga_jual: "",
        deskripsi: "",
        harga_beli: "",
        tanggal: new Date().toISOString().slice(0,10),
      })
      setIsEdit(false)
      setIsViewOnly(mode === 'view')
      setSelectedId("")
    }
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isReadOnly) {
      showWarningAlert("Akses Ditolak", "Role Anda hanya bisa melihat data produk")
      return
    }

    const hargaJualNum = Number(String(form.harga_jual).replace(/\D/g, ""))
    const hargaBeliNum = form.harga_beli === "" ? 0 : Number(String(form.harga_beli).replace(/\D/g, ""))

    // Buat payload yang sesuai dengan struktur backend
    const payload = {
      nama_produk: form.nama_produk,
      kategori_id: form.kategori_id,
      harga_jual: hargaJualNum,
      harga_beli: hargaBeliNum,
      deskripsi: form.deskripsi,
    }

    if (
      !payload.nama_produk ||
      !payload.kategori_id ||
      isNaN(payload.harga_jual) ||
      !payload.deskripsi
    ) {
      showErrorAlert("Gagal", "Semua field wajib diisi dengan benar")
      return
    }
    if (payload.harga_jual <= 0) {
      showErrorAlert("Gagal", "Harga harus berupa angka positif")
      return
    }
    if (isNaN(payload.harga_beli) || payload.harga_beli < 0) {
      showErrorAlert("Gagal", "Harga beli tidak boleh negatif")
      return
    }
    // Stok dikelola di halaman Stok; tidak bisa diinput di sini

    const confirm = await showConfirmAlert(
      isEdit ? "Yakin akan mengedit data?" : "Yakin akan menambahkan data?",
      "",
      "Ya, simpan",
      "Batal"
    )

    if (!confirm.isConfirmed) return

    try {
      if (isEdit) {
        await updateProduk(selectedId, payload)
        await showSuccessAlert("Produk berhasil diperbarui")
      } else {
        await createProduk(payload)
        await showSuccessAlert("Produk berhasil ditambahkan")
      }

      setModalOpen(false)
      fetchData()
    } catch (e) {
      showErrorAlert("Gagal", e?.response?.data?.message || e?.message || "Terjadi kesalahan")
    }
  }

  const handleDelete = async (id) => {
    if (isReadOnly) {
      showWarningAlert("Akses Ditolak", "Role Anda hanya bisa melihat data produk")
      return
    }

    const confirm = await showConfirmAlert(
      "Yakin akan menghapus produk ini?",
      "Tindakan ini tidak bisa dibatalkan.",
      "Ya, hapus",
      "Batal"
    )
    if (!confirm.isConfirmed) return

    try {
      await deleteProduk(id)
      await showSuccessAlert("Produk berhasil dihapus")
      fetchData()
    } catch (e) {
      showErrorAlert("Gagal", e?.response?.data?.message || e?.message || "Terjadi kesalahan")
    }
  }

  const filteredData = (Array.isArray(produk) ? produk : []).filter((item) => {
    const q = (searchId || "").toLowerCase().trim()
    if (!q) return true
    const idStr = String(item.id || "").toLowerCase()
    const nameStr = String(item.nama_produk || "").toLowerCase()
    return idStr.includes(q) || nameStr.includes(q)
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const changePage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
  }

  const formatTanggal = (value) => {
    if (!value) return "-"
    const d = new Date(value)
    if (isNaN(d)) return "-"
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <PageWrapper 
      title={
        <div className="flex items-center gap-2">
          <span>Manajemen Produk</span>
          {isReadOnly && (
            <span className="text-xs px-2 py-1 rounded border border-white/20 bg-white/10 text-white/80">Read Only</span>
          )}
        </div>
      }
      description="Lihat data produk bisnis Anda"
    >
      {/* Search Bar */}
      <Card className="mb-6">
        <div className="flex items-center space-x-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="w-5 h-5 text-white/60 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan ID atau nama produk..."
              value={searchId}
              onChange={(e) => {
                setSearchId(e.target.value)
                setCurrentPage(1)
              }}
              className="input-glass w-full pl-10 pr-4 py-2"
            />
          </div>

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => openModal(null, 'create')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Tambah Produk
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="table-glass min-w-full">
            <thead className="thead-glass">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Nama Produk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Harga</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Stok</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Deskripsi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="tbody-glass">
              {paginatedData.map((item) => (
                <tr key={item.id} className="row-glass">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white/90">{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/90">{item.nama_produk}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/90">{(Array.isArray(kategori) ? kategori : []).find(k => k._id === item.kategori_id)?.nama_kategori || item.kategori_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/90">{formatRupiah(item.harga_jual)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/90">{saldoMap[item.id] ?? item.stok ?? 0}</td>
                  <td className="px-6 py-4 text-sm text-white/90 max-w-xs truncate">{item.deskripsi}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/90">{formatTanggal(item.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openModal(item, 'view')}
                      className="btn-secondary-glass px-3 py-1"
                      title="Detail Produk"
                    >
                      Detail
                    </button>

                    {!isReadOnly && (
                      <>
                        <button
                          onClick={() => openModal(item, 'edit')}
                          className="btn-secondary-glass px-3 py-1"
                          title="Edit Produk"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="btn-secondary-glass px-3 py-1"
                          title="Hapus Produk"
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-white/10">
            <button
              onClick={() => changePage(currentPage - 1)}
              className="btn-secondary-glass px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => changePage(i + 1)}
                className={`px-3 py-2 text-sm rounded-lg ${
                  currentPage === i + 1
                    ? "bg-sky-600 text-white"
                    : "btn-secondary-glass"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => changePage(currentPage + 1)}
              className="btn-secondary-glass px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </Card>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="card-glass backdrop-blur-md shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {isViewOnly ? "Detail Produk" : (isEdit ? "Edit Produk" : "Tambah Produk")}
                </h2>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isEdit && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">ID Produk</label>
                  <input
                    type="text"
                    value={form.id}
                    disabled
                    className="input-glass w-full px-3 py-2 opacity-70 cursor-not-allowed"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Nama Produk</label>
                <input
                  type="text"
                  value={form.nama_produk}
                  onChange={(e) => setForm({ ...form, nama_produk: e.target.value })}
                  placeholder="Contoh: Smartphone Samsung Galaxy A54"
                  className="input-glass w-full px-3 py-2"
                  disabled={isViewOnly}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Kategori</label>
                <select
                  value={form.kategori_id}
                  onChange={(e) => setForm({ ...form, kategori_id: e.target.value })}
                  className="input-glass w-full px-3 py-2"
                  disabled={isViewOnly}
                  required
                >
                  <option value="" disabled>Pilih kategori</option>
                  {(Array.isArray(kategori) ? kategori : []).map((k, idx) => (
                    <option key={k?._id || k?.id || `${k?.nama_kategori || 'opt'}-${idx}`} value={k?._id || k?.id}>
                      {k?.nama_kategori || k?._id || k?.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Harga Jual</label>
                <input
                  type="text"
                  value={form.harga_jual}
                  onChange={(e) => setForm({ ...form, harga_jual: formatIDRInput(e.target.value) })}
                  placeholder="Masukkan harga jual (contoh: 5.000.000)"
                  className="input-glass w-full px-3 py-2"
                  disabled={isViewOnly}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Harga Beli</label>
                <input
                  type="text"
                  value={form.harga_beli}
                  onChange={(e) => setForm({ ...form, harga_beli: formatIDRInput(e.target.value) })}
                  placeholder="Masukkan harga beli (contoh: 5.000.000)"
                  className="input-glass w-full px-3 py-2"
                  disabled={isViewOnly}
                />
              </div>

              {/* Stok hanya ditampilkan di tabel, dikelola via halaman Stok */}

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Deskripsi</label>
                <textarea
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  placeholder="Deskripsi detail produk, spesifikasi, dan fitur-fitur yang dimiliki..."
                  className="input-glass w-full px-3 py-2"
                  rows="3"
                  disabled={isViewOnly}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  className="input-glass w-full px-3 py-2 opacity-70 cursor-not-allowed"
                  disabled
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary-glass px-4 py-2 text-sm font-medium"
                >
                  {isViewOnly ? 'Tutup' : 'Batal'}
                </button>
                {!isViewOnly && (
                  <button
                    type="submit"
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isEdit 
                        ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500" 
                        : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    }`}
                  >
                    {isEdit ? "Simpan Perubahan" : "Tambah Produk"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

export default Produk
