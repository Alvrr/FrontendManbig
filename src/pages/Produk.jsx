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
  showSuccessAlert,
  showConfirmAlert
} from "../utils/alertUtils"
import PageWrapper from "../components/PageWrapper"
import Card from "../components/Card"
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline"
import { decodeJWT } from "../utils/jwtDecode"
import { formatRupiah } from "../utils/currency"
import { getKategori } from "../services/kategoriAPI"
import { getSaldoProduk } from "../services/stokAPI"

const Produk = () => {
  const [produk, setProduk] = useState([])
  const [user, setUser] = useState({ role: "" })
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
  const [selectedId, setSelectedId] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const fetchData = async () => {
    const [dataProduk, dataKategori] = await Promise.all([
      getAllProduk(),
      getKategori(),
    ])
    setProduk(dataProduk)
    setKategori(dataKategori)
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
    // Ambil role user dari JWT
    const token = localStorage.getItem("token")
    const decoded = decodeJWT(token)
    setUser({ role: decoded?.role || "" })
    fetchData()
  }, [])

  const openModal = (item = null) => {
    if (user.role === "driver") {
      showWarningAlert("Akses Ditolak", "Role anda dibatasi untuk aksi ini")
      return
    }
    if (item) {
      setForm({
        id: item.id,
        nama_produk: item.nama_produk || "",
        kategori_id: item.kategori_id || "",
        harga_jual: item.harga_jual !== undefined && item.harga_jual !== null ? String(item.harga_jual) : "",
        harga_beli: item.harga_beli !== undefined && item.harga_beli !== null ? String(item.harga_beli) : "",
        deskripsi: item.deskripsi || "",
        tanggal: item.created_at ? new Date(item.created_at).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
      })
      setSelectedId(item.id)
      setIsEdit(true)
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
      setSelectedId("")
    }
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    if (user.role === "driver") {
      showWarningAlert("Akses Ditolak", "Role anda dibatasi untuk aksi ini")
      return
    }
    e.preventDefault()

    // Buat payload yang sesuai dengan struktur backend
    const payload = {
      nama_produk: form.nama_produk,
      kategori_id: form.kategori_id,
      harga_jual: Number(form.harga_jual),
      harga_beli: form.harga_beli === "" ? 0 : Number(form.harga_beli),
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
    if (user.role === "driver") {
      showWarningAlert("Akses Ditolak", "Role anda dibatasi untuk aksi ini")
      return
    }
    const confirm = await showConfirmAlert("Yakin akan menghapus data ini?", "Data yang dihapus tidak dapat dikembalikan!", "Ya, hapus", "Batal")

    if (!confirm.isConfirmed) return

    try {
      await deleteProduk(id)
      await showSuccessAlert("Produk berhasil dihapus")
      fetchData()
    } catch (e) {
      showErrorAlert("Gagal", e?.response?.data?.message || e?.message || "Terjadi kesalahan saat menghapus data")
    }
  }

  const filteredData = produk.filter((item) =>
    searchId === "" || item.id.toString().includes(searchId)
  )

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
      title="Manajemen Produk" 
      description="Kelola data produk bisnis Anda"
      action={
        user.role !== "driver" && (
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Tambah Produk</span>
          </button>
        )
      }
    >
      {/* Search Bar */}
      <Card className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan ID produk..."
              value={searchId}
              onChange={(e) => {
                setSearchId(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Produk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama_produk}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kategori.find(k => k._id === item.kategori_id)?.nama_kategori || item.kategori_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatRupiah(item.harga_jual)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{saldoMap[item.id] ?? item.stok ?? 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{item.deskripsi}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTanggal(item.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {user.role !== "driver" && (
                      <>
                        <button
                          onClick={() => openModal(item)}
                          className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg transition-colors"
                          title="Edit Produk"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                          title="Hapus Produk"
                        >
                          <TrashIcon className="w-4 h-4" />
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
          <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => changePage(currentPage - 1)}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => changePage(currentPage + 1)}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEdit ? "Edit Produk" : "Tambah Produk"}
                </h2>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Produk</label>
                  <input
                    type="text"
                    value={form.id}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  value={form.nama_produk}
                  onChange={(e) => setForm({ ...form, nama_produk: e.target.value })}
                  placeholder="Contoh: Smartphone Samsung Galaxy A54"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={form.kategori_id}
                  onChange={(e) => setForm({ ...form, kategori_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual</label>
                <input
                  type="number"
                  value={form.harga_jual}
                  onChange={(e) => setForm({ ...form, harga_jual: e.target.value })}
                  placeholder="Masukkan harga jual dalam rupiah (contoh: 5000000)"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli</label>
                <input
                  type="number"
                  value={form.harga_beli}
                  onChange={(e) => setForm({ ...form, harga_beli: e.target.value })}
                  placeholder="Masukkan harga beli (boleh 0)"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Stok hanya ditampilkan di tabel, dikelola via halaman Stok */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  placeholder="Deskripsi detail produk, spesifikasi, dan fitur-fitur yang dimiliki..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Batal
                </button>
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
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

export default Produk
