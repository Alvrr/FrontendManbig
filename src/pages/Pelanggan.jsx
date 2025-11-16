import { useEffect, useState } from "react"
import {
  getAllPelanggan,
  createPelanggan,
  updatePelanggan,
  deletePelanggan,
} from "../services/pelangganAPI"
import { 
  showSuccessAlert, 
  showErrorAlert, 
  showDeleteConfirmAlert,
  showWarningAlert,
  showConfirmAlert 
} from "../utils/alertUtils"
import PageWrapper from "../components/PageWrapper"
import Card from "../components/Card"
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline"
import { decodeJWT } from "../utils/jwtDecode"

const Pelanggan = () => {
  const [pelanggan, setPelanggan] = useState([])
  const [user, setUser] = useState({ role: "" })
  const [searchTerm, setSearchTerm] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    nama: "",
    email: "",
    no_hp: "",
    alamat: "",
  })
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const fetchData = async () => {
    const data = await getAllPelanggan()
    console.log('Fetched pelanggan data:', data); // Debug log
    setPelanggan(data)
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
      showWarningAlert(
        "Akses Ditolak",
        "Role anda dibatasi untuk aksi ini"
      )
      return
    }
    if (item) {
      setForm({
        id: item.id,
        nama: item.nama || "",
        email: item.email || "",
        no_hp: item.no_hp || "",
        alamat: item.alamat || "",
      })
      setSelectedId(item.id)
      setIsEdit(true)
    } else {
      setForm({
        nama: "",
        email: "",
        no_hp: "",
        alamat: "",
      })
      setIsEdit(false)
      setSelectedId("")
    }
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    if (user.role === "driver") {
      showWarningAlert(
        "Akses Ditolak",
        "Role anda dibatasi untuk aksi ini"
      )
      return
    }
    e.preventDefault()

    // Validasi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      showErrorAlert("Gagal", "Format email tidak valid")
      return
    }

    // Validasi no HP (minimal 10 digit)
    if (form.no_hp.length < 10) {
      showErrorAlert("Gagal", "Nomor HP minimal 10 digit")
      return
    }

    // Buat payload yang sesuai dengan struktur backend
    const payload = {
      nama: form.nama,
      email: form.email,
      no_hp: form.no_hp,
      alamat: form.alamat,
    }

    const confirm = await showConfirmAlert(
      isEdit ? "Yakin akan mengedit data?" : "Yakin akan menambahkan data?",
      "",
      "Ya, simpan",
      "Batal"
    )

    if (!confirm.isConfirmed) return

    try {
      if (isEdit) {
        await updatePelanggan(selectedId, payload)
        await showSuccessAlert("Pelanggan berhasil diperbarui")
      } else {
        await createPelanggan(payload)
        await showSuccessAlert("Pelanggan berhasil ditambahkan")
      }

      setModalOpen(false)
      fetchData()
    } catch {
      showErrorAlert("Gagal", "Terjadi kesalahan")
    }
  }

  const handleDelete = async (id) => {
    if (user.role === "driver") {
      showWarningAlert(
        "Akses Ditolak",
        "Role anda dibatasi untuk aksi ini"
      )
      return
    }
    const confirm = await showDeleteConfirmAlert(
      "Yakin akan menghapus data ini?",
      "Data yang dihapus tidak dapat dikembalikan!"
    )

    if (!confirm.isConfirmed) return

    try {
      await deletePelanggan(id)
      await showSuccessAlert("Pelanggan berhasil dihapus")
      fetchData()
    } catch {
      showErrorAlert("Gagal", "Terjadi kesalahan saat menghapus data")
    }
  }

  const filteredData = pelanggan.filter((item) =>
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.no_hp.includes(searchTerm)
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

  return (
    <PageWrapper 
      title="Manajemen Pelanggan" 
      description="Kelola data pelanggan bisnis Anda"
      action={
        user.role !== "driver" && (
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Tambah Pelanggan</span>
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
              placeholder="Cari nama, email, atau nomor HP..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. HP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.no_hp}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{item.alamat}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {user.role !== "driver" && (
                      <>
                        <button
                          onClick={() => openModal(item)}
                          className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg transition-colors"
                          title="Edit Pelanggan"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                          title="Hapus Pelanggan"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEdit ? "Edit Pelanggan" : "Tambah Pelanggan"}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Pelanggan</label>
                  <input
                    type="text"
                    value={form.id}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Contoh: Ahmad Suherman"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Contoh: ahmad.suherman@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
                <input
                  type="tel"
                  value={form.no_hp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "")
                    setForm({ ...form, no_hp: value })
                  }}
                  placeholder="Contoh: 081234567890 (minimal 10 digit)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  placeholder="Contoh: Jl. Merdeka No. 123, RT 05/RW 03, Kelurahan Sukamaju, Kecamatan Bandung Utara, Kota Bandung, Jawa Barat 40123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  required
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
                  {isEdit ? "Simpan Perubahan" : "Tambah Pelanggan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

export default Pelanggan
