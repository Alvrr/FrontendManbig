import React, { useState, useEffect } from 'react';
import { getAllKaryawan, createKaryawan, updateKaryawan, deleteKaryawan } from '../services/karyawanAPI';
import { 
  showSuccessAlert, 
  showErrorAlert, 
  showDeleteConfirmAlert,
  showWarningAlert
} from '../utils/alertUtils';
import { UserPlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, UserGroupIcon, ShieldCheckIcon, TruckIcon, FunnelIcon } from '@heroicons/react/24/outline';

const DataKaryawan = () => {
  const [karyawan, setKaryawan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedKaryawan, setSelectedKaryawan] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    role: 'kasir',
    no_hp: '',
    alamat: '',
    status: 'aktif'
  });

  const itemsPerPage = 10;

  useEffect(() => {
    // Check user authentication and role
    const token = localStorage.getItem('token');
    if (!token) {
      showErrorAlert(
        'Akses Ditolak',
        'Anda harus login terlebih dahulu'
      ).then(() => {
        window.location.href = '/login';
      });
      return;
    }

    try {
      const userData = JSON.parse(atob(token.split('.')[1]));
      
      if (userData.role !== 'admin') {
        showErrorAlert(
          'Akses Ditolak',
          'Hanya admin yang dapat mengakses halaman ini'
        ).then(() => {
          window.location.href = '/dashboard';
        });
        return;
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }

    fetchKaryawan();
  }, []);

  const fetchKaryawan = async () => {
    try {
      setLoading(true);
      const data = await getAllKaryawan();
      console.log('Data karyawan received:', data); // Debug log
      console.log('Data type:', typeof data); // Debug log
      console.log('Is Array:', Array.isArray(data)); // Debug log
      console.log('Sample data structure:', data[0]); // Debug log
      setKaryawan(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error:', err);
      showErrorAlert(
        'Error',
        err?.response?.data?.message || 'Gagal memuat data karyawan'
      );
    }
    setLoading(false);
  };

  const handleOpenModal = (mode, karyawan = null) => {
    console.log('Opening modal for:', mode, karyawan); // Debug log
    setModalMode(mode);
    setSelectedKaryawan(karyawan);
    if (mode === 'edit' && karyawan) {
      setFormData({
        nama: karyawan.nama,
        email: karyawan.email,
        password: '',
        role: karyawan.role,
        status: karyawan.status,
        no_hp: karyawan.no_hp || '',
        alamat: karyawan.alamat || ''
      });
    } else {
      setFormData({
        nama: '',
        email: '',
        password: '',
        role: 'kasir',
        no_hp: '',
        alamat: '',
        status: 'aktif'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedKaryawan(null);
    setFormData({
      nama: '',
      email: '',
      password: '',
      role: 'kasir',
      no_hp: '',
      alamat: '',
      status: 'aktif'
    });
  };

  const validateForm = () => {
    if (!formData.nama || formData.nama.length < 2) {
      showWarningAlert(
        'Validasi Error',
        'Nama minimal 2 karakter'
      );
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      showWarningAlert(
        'Validasi Error',
        'Email tidak valid'
      );
      return false;
    }

    if (modalMode === 'create' && (!formData.password || formData.password.length < 6)) {
      showWarningAlert(
        'Validasi Error',
        'Password minimal 6 karakter'
      );
      return false;
    }

    if (modalMode === 'edit' && formData.password && formData.password.length < 6) {
      showWarningAlert(
        'Validasi Error',
        'Password minimal 6 karakter'
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData = { ...formData };
      if (modalMode === 'edit' && !submitData.password) {
        delete submitData.password;
      }

      if (modalMode === 'create') {
        await createKaryawan(submitData);
        showSuccessAlert(
          'Sukses',
          'Karyawan berhasil ditambah'
        );
      } else if (modalMode === 'edit' && selectedKaryawan) {
        console.log('Updating karyawan with ID:', selectedKaryawan.id); // Debug log
        console.log('Update data:', submitData); // Debug log
        await updateKaryawan(selectedKaryawan.id, submitData);
        showSuccessAlert(
          'Sukses',
          'Karyawan berhasil diupdate'
        );
      }
      fetchKaryawan();
      handleCloseModal();
    } catch (err) {
      showErrorAlert(
        'Error',
        err?.response?.data?.message || 'Gagal simpan data'
      );
    }
  };

  const handleDelete = async (id) => {
    console.log('Deleting karyawan with ID:', id); // Debug log
    const confirm = await showDeleteConfirmAlert(
      'Konfirmasi Hapus',
      'Yakin ingin menghapus karyawan ini?'
    );
    if (!confirm.isConfirmed) return;
    
    try {
      await deleteKaryawan(id);
      showSuccessAlert(
        'Sukses',
        'Karyawan berhasil dihapus'
      );
      fetchKaryawan();
    } catch (err) {
      showErrorAlert(
        'Error',
        err?.response?.data?.message || 'Gagal hapus data'
      );
    }
  };

  // Filter dan search dengan pagination
  const filteredKaryawan = karyawan.filter(k => {
    const matchRole = roleFilter === 'all' || k.role === roleFilter;
    const matchStatus = statusFilter === 'all' || k.status === statusFilter;
    const matchSearch =
      k.nama.toLowerCase().includes(search.toLowerCase()) ||
      k.email.toLowerCase().includes(search.toLowerCase()) ||
      k.id.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch && matchStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredKaryawan.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredKaryawan.length / itemsPerPage);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <ShieldCheckIcon className="w-4 h-4 text-red-500" />;
      case 'kasir': return <UserGroupIcon className="w-4 h-4 text-blue-500" />;
      case 'driver': return <TruckIcon className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'kasir': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'driver': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <UserGroupIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Data Karyawan</h1>
                <p className="text-gray-600 mt-1">Kelola data karyawan perusahaan</p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              onClick={() => handleOpenModal('create')}
            >
              <UserPlusIcon className="w-5 h-5" />
              Tambah Karyawan
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filter & Pencarian</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nama, email, atau ID..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="kasir">Kasir</option>
              <option value="driver">Driver</option>
            </select>
            <select
              className="border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Non-aktif</option>
            </select>
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
              Total: <span className="font-semibold ml-1">{filteredKaryawan.length}</span> karyawan
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Karyawan</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontak</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Tidak ada data karyawan</p>
                        <p className="text-sm">Coba ubah filter atau tambah karyawan baru</p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.map((k, index) => (
                  <tr key={`${k.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">{k.nama.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{k.nama}</div>
                          <div className="text-sm text-gray-500">{k.email}</div>
                          <div className="text-xs text-gray-400 font-mono">{k.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRoleIcon(k.role)}
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(k.role)}`}>
                          {k.role.charAt(0).toUpperCase() + k.role.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${k.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${k.status === 'aktif' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        {k.status === 'aktif' ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {k.no_hp || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {k.alamat || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          onClick={() => handleOpenModal('edit', k)}
                          title="Edit Karyawan"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                          onClick={() => handleDelete(k.id)}
                          title="Hapus Karyawan"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Menampilkan <span className="font-medium">{indexOfFirstItem + 1}</span> sampai <span className="font-medium">{Math.min(indexOfLastItem, filteredKaryawan.length)}</span> dari <span className="font-medium">{filteredKaryawan.length}</span> hasil
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, index) => (
                        <button
                          key={`page-${index + 1}`}
                          onClick={() => setCurrentPage(index + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === index + 1
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Tambah/Edit */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalMode === 'create' ? 'Tambah Karyawan Baru' : 'Edit Data Karyawan'}
                  </h2>
                  <button 
                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors" 
                    onClick={handleCloseModal}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                    value={formData.nama} 
                    onChange={e => setFormData({ ...formData, nama: e.target.value })} 
                    placeholder="Masukkan nama lengkap"
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                    value={formData.email} 
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="contoh@email.com"
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                    value={formData.role} 
                    onChange={e => setFormData({ ...formData, role: e.target.value })} 
                    required
                  >
                    <option value="kasir">Kasir</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">No HP</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                    value={formData.no_hp} 
                    onChange={e => setFormData({ ...formData, no_hp: e.target.value })} 
                    placeholder="08123456789"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                  <textarea 
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none" 
                    value={formData.alamat} 
                    onChange={e => setFormData({ ...formData, alamat: e.target.value })} 
                    placeholder="Alamat lengkap"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                    value={formData.status} 
                    onChange={e => setFormData({ ...formData, status: e.target.value })} 
                    required
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-aktif</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {modalMode === 'create' && <span className="text-red-500">*</span>}
                    {modalMode === 'edit' && <span className="text-gray-500 text-xs">(Kosongkan jika tidak ingin mengubah)</span>}
                  </label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                    value={formData.password} 
                    onChange={e => setFormData({ ...formData, password: e.target.value })} 
                    placeholder={modalMode === 'create' ? 'Masukkan password' : 'Password baru (opsional)'}
                    required={modalMode === 'create'} 
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button 
                    type="button" 
                    className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium" 
                    onClick={handleCloseModal}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-md"
                  >
                    {modalMode === 'create' ? 'Tambah Karyawan' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataKaryawan;