// pages/Pembayaran.jsx
import React, { useEffect, useState } from "react";
import { decodeJWT } from "../utils/jwtDecode";
import { getAllPembayaran, createPembayaran } from "../services/pembayaranAPI";
import { getAllPelanggan } from "../services/pelangganAPI";
import { getAllDrivers } from "../services/driverAPI";
import { getAllProduk } from "../services/produkAPI";
import Swal from "sweetalert2";
import axiosInstance from "../services/axiosInstance";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/Card";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const Pembayaran = () => {
  const [pembayaran, setPembayaran] = useState([]);
  const [user, setUser] = useState({ role: '', id: '' });
  const [pelanggan, setPelanggan] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [produk, setProduk] = useState([]);
  const [form, setForm] = useState({
    id_pelanggan: "",
    tanggal: new Date(),
    produk: [],
    total_bayar: 0,
    jenis_pengiriman: "",
    id_driver: "",
    nama_driver: "",
    ongkir: 0,
    nama_kasir: ""
  });
  const [showPopup, setShowPopup] = useState(false);
  const [produkDipilih, setProdukDipilih] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    // Ambil role, id, dan nama user dari JWT
    const token = localStorage.getItem('token');
    const decoded = decodeJWT(token);
    setUser({ role: decoded?.role || '', id: decoded?.id || '', nama: decoded?.nama || '' });
    setForm(f => ({ ...f, nama_kasir: decoded?.nama || '' }));
    fetchPembayaran();
    fetchPelanggan();
    fetchProduk();
    fetchDrivers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPembayaran = async () => {
    const data = await getAllPembayaran();
    console.log('Fetched pembayaran data:', data); // Debug log
    console.log('Current user:', user); // Debug log
    setPembayaran(data);
  };


  const fetchPelanggan = async () => {
    const data = await getAllPelanggan();
    setPelanggan(data);
  };

  const fetchDrivers = async () => {
    try {
      const data = await getAllDrivers();
      setDrivers(Array.isArray(data) ? data : []);
    } catch {
      setDrivers([]);
    }
  };

  const fetchProduk = async () => {
    const data = await getAllProduk();
    setProduk(data);
  };

  const handleAddProduk = () => {
    if (user.role === "driver") {
      Swal.fire({
        icon: "warning",
        title: "Akses Ditolak",
        text: "Driver tidak diizinkan menambah produk ke transaksi.",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600",
        },
        buttonsStyling: false,
      });
      return;
    }
    setProdukDipilih([
      ...produkDipilih,
      {
        id_produk: "",
        nama_produk: "",
        harga: 0,
        jumlah: 1,
        subtotal: 0,
      },
    ]);
  };

  const handleRemoveProduk = async (index) => {
    if (user.role === "driver") {
      Swal.fire({
        icon: "warning",
        title: "Akses Ditolak",
        text: "Driver tidak diizinkan menghapus produk dari transaksi.",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600",
        },
        buttonsStyling: false,
      });
      return;
    }
    const confirm = await Swal.fire({
      title: "Hapus produk ini?",
      text: "Produk akan dihapus dari daftar pembayaran.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      customClass: {
        confirmButton: "bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700",
        cancelButton: "bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500",
      },
      buttonsStyling: false,
    });

    if (!confirm.isConfirmed) return;

    const updatedList = [...produkDipilih];
    updatedList.splice(index, 1);
    setProdukDipilih(updatedList);
    updateTotalBayar(updatedList);
  };

  const handleProdukChange = (index, id_produk) => {
    const produkTerpilih = produk.find((p) => p.id === id_produk);
    const list = [...produkDipilih];
    list[index] = {
      ...list[index],
      id_produk,
      nama_produk: produkTerpilih?.nama_produk || "",
      harga: parseInt(produkTerpilih?.harga || 0),
      subtotal: parseInt(produkTerpilih?.harga || 0) * list[index].jumlah,
    };
    setProdukDipilih(list);
    updateTotalBayar(list);
  };

  const handleJumlahChange = (index, jumlah) => {
    if (user.role === "driver") {
      Swal.fire({
        icon: "warning",
        title: "Akses Ditolak",
        text: "Driver tidak diizinkan mengubah jumlah produk.",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600",
        },
        buttonsStyling: false,
      });
      return;
    }
    const list = [...produkDipilih];
    const produkDetail = produk.find(p => p.id === list[index].id_produk);
    // Pastikan jumlah minimal 1
    const jumlahInt = Math.max(1, parseInt(jumlah) || 1);
    // Validasi jika jumlah melebihi stok
    if (produkDetail && jumlahInt > produkDetail.stok) {
      Swal.fire({
        icon: "warning",
        title: "Jumlah melebihi stok",
        text: `Stok ${produkDetail.nama_produk} hanya tersedia ${produkDetail.stok}`,
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600",
        },
        buttonsStyling: false,
      });
      // Set jumlah ke stok maksimal yang tersedia
      list[index].jumlah = produkDetail.stok;
      list[index].subtotal = list[index].harga * produkDetail.stok;
      setProdukDipilih(list);
      updateTotalBayar(list);
      return;
    }
    list[index].jumlah = jumlahInt;
    list[index].subtotal = list[index].harga * jumlahInt;
    setProdukDipilih(list);
    updateTotalBayar(list);
  };

  const updateTotalBayar = (list, pengiriman = form.jenis_pengiriman, ongkirManual = form.ongkir) => {
    const totalProduk = list.reduce((sum, item) => sum + item.subtotal, 0);
    let ongkir = 0;
    if (pengiriman === "motor") ongkir = 10000;
    else if (pengiriman === "mobil") ongkir = 20000;
    else if (pengiriman === "ambil_sendiri") ongkir = 0;
    // Jika ongkirManual diisi manual (misal backend hitung), pakai itu
    if (typeof ongkirManual === 'number' && ongkirManual > 0) ongkir = ongkirManual;
    setForm(f => ({ ...f, total_bayar: totalProduk + ongkir, ongkir }));
  };

  const handleSubmit = async () => {
    // Role check: hanya admin & kasir yang boleh tambah pembayaran
    if (!["admin", "kasir"].includes(user.role)) {
      Swal.fire({
        icon: "warning",
        title: "Akses Ditolak",
        text: "Role Anda tidak diizinkan menambah pembayaran.",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600",
        },
        buttonsStyling: false,
      });
      return;
    }
    // Validasi data dasar
    if (!form.id_pelanggan || produkDipilih.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Data tidak lengkap",
        text: "Pelanggan harus dipilih dan minimal 1 produk harus ditambahkan",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600",
        },
        buttonsStyling: false,
      });
      return;
    }

    // Validasi produk yang dipilih
    for (const item of produkDipilih) {
      if (!item.id_produk) {
        await Swal.fire({
          icon: "warning",
          title: "Produk belum dipilih",
          text: "Semua produk dalam daftar harus dipilih",
          confirmButtonText: "OK",
          customClass: {
            confirmButton: "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600",
          },
          buttonsStyling: false,
        });
        return;
      }
      // Validasi produk benar-benar ada di master produk
      const produkDetail = produk.find(p => p.id === item.id_produk);
      if (!produkDetail) {
        await Swal.fire({
          icon: "error",
          title: "Produk tidak ditemukan",
          text: `Produk dengan ID ${item.id_produk} tidak ditemukan di master produk. Pilih produk yang valid.`,
          confirmButtonText: "OK",
          customClass: {
            confirmButton: "bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700",
          },
          buttonsStyling: false,
        });
        return;
      }
    }

    // Validasi stok produk
    for (const item of produkDipilih) {
      const produkDetail = produk.find(p => p.id === item.id_produk);
      if (produkDetail && item.jumlah > produkDetail.stok) {
        await Swal.fire({
          icon: "error",
          title: "Stok tidak mencukupi",
          text: `Stok ${produkDetail.nama_produk} hanya tersedia ${produkDetail.stok}, tidak dapat membeli ${item.jumlah}`,
          confirmButtonText: "OK",
          customClass: {
            confirmButton: "bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700",
          },
          buttonsStyling: false,
        });
        return;
      }
    }

    const confirm = await Swal.fire({
      title: "Yakin ingin menyimpan pembayaran ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, simpan",
      cancelButtonText: "Batal",
      customClass: {
        confirmButton: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700",
        cancelButton: "bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500",
      },
      buttonsStyling: false,
    });

    if (!confirm.isConfirmed) return;

    try {
      const data = {
        ...form,
        tanggal: new Date().toISOString(),
        produk: produkDipilih,
        status: "Pending",
      };

      console.log('Data pembayaran yang akan disimpan:', data);

      const response = await createPembayaran(data);
      console.log('Response pembayaran:', response.data);

      await Swal.fire({
        icon: "success",
        title: "Pembayaran berhasil disimpan",
        text: "Transaksi telah berhasil dibuat",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700",
        },
        buttonsStyling: false,
      });

      fetchPembayaran();
      fetchProduk(); // Refresh data produk untuk update stok
      setShowPopup(false);
      setForm({
        id_pelanggan: "",
        tanggal: new Date(),
        produk: [],
        total_bayar: 0,
      });
      setProdukDipilih([]);
    } catch (error) {
      console.error('Error saat menyimpan pembayaran:', error.response?.data || error.message);
      Swal.fire({
        icon: "error",
        title: "Gagal menyimpan",
        text: error.response?.data?.message || "Terjadi kesalahan saat menyimpan data",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700",
        },
        buttonsStyling: false,
      });
    }
  };

  const handleSelesai = async (item) => {
    // Role yang boleh: admin, kasir, driver (driver hanya untuk transaksi miliknya)
    if (
      user.role === "driver" && item.id_driver !== user.id
    ) {
      Swal.fire({
        icon: "warning",
        title: "Akses Ditolak",
        text: "Driver hanya bisa menyelesaikan transaksi miliknya.",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600",
        },
        buttonsStyling: false,
      });
      return;
    }

    if (!["admin", "kasir", "driver"].includes(user.role)) {
      Swal.fire({
        icon: "warning",
        title: "Akses Ditolak",
        text: "Role Anda tidak diizinkan menyelesaikan pembayaran.",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600",
        },
        buttonsStyling: false,
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "Selesaikan Pembayaran",
      text: `Yakin ingin menyelesaikan pembayaran dengan ID ${item.id}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, selesaikan",
      cancelButtonText: "Batal",
      customClass: {
        confirmButton: "bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700",
        cancelButton: "bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500",
      },
      buttonsStyling: false,
    });

    if (!confirm.isConfirmed) return;

    try {
      await axiosInstance.put(`/pembayaran/selesaikan/${item.id}`);
      await Swal.fire({
        icon: "success",
        title: "Pembayaran Selesai",
        text: "Transaksi telah diselesaikan dan dipindahkan ke riwayat.",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700",
        },
        buttonsStyling: false,
      });
      fetchPembayaran();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Terjadi kesalahan saat menyelesaikan pembayaran",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700",
        },
        buttonsStyling: false,
      });
    }
  };

  const handleCetakStruk = async (pembayaranId) => {
    try {
      // Gunakan axiosInstance yang sudah include JWT token
      const response = await axiosInstance.get(`/pembayaran/cetak/${pembayaranId}`, {
        responseType: 'blob' // Untuk handle file PDF/HTML
      });

      // Buat blob URL dan buka di tab baru
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Cleanup URL setelah 1 detik
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);

    } catch (error) {
      console.error('Error saat mencetak struk:', error);
      
      let errorMessage = "Terjadi kesalahan saat mencetak struk";
      if (error.response?.status === 401) {
        errorMessage = "Sesi Anda telah berakhir. Silakan login kembali.";
      } else if (error.response?.status === 404) {
        errorMessage = "Data pembayaran tidak ditemukan";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Swal.fire({
        icon: "error",
        title: "Gagal Mencetak",
        text: errorMessage,
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700",
        },
        buttonsStyling: false,
      });
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(angka);
  };

  // Defensive: pembayaran always array
  const pembayaranArr = Array.isArray(pembayaran) ? pembayaran : [];
  // Filter transaksi aktif (status !== 'Selesai')
  const transaksiAktif = pembayaranArr.filter(item => item && item.status !== 'Selesai');
  // Filter sesuai role - sama seperti implementasi driver
  const transaksiTampil = user.role === 'driver'
    ? transaksiAktif.filter(item => item && item.id_driver === user.id)
    : user.role === 'kasir'
    ? transaksiAktif.filter(item => item && item.id_kasir === user.id)
    : transaksiAktif;
  // Search
  const filteredPembayaran = transaksiTampil.filter((item) =>
    item && item.id && item.id.toLowerCase().includes(searchId.toLowerCase())
  );
  const dataToDisplay = searchId ? filteredPembayaran : transaksiTampil;
  const totalPages = Math.ceil(dataToDisplay.length / itemsPerPage);
  const paginatedData = dataToDisplay.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <PageWrapper 
      title="Manajemen Pembayaran" 
      description="Kelola data pembayaran bisnis Anda"
      action={
        <button
          onClick={() => setShowPopup(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Transaksi Baru</span>
        </button>
      }
    >
      {/* Search Bar */}
      <Card className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ID Pembayaran..."
              value={searchId}
              onChange={(e) => {
                setSearchId(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>


        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Pelanggan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Kasir</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Driver</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Produk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Ongkir</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Total Bayar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item) => {
                const pelangganDetail = pelanggan.find(p => p.id === item.id_pelanggan);
                
                // Debug log untuk driver access
                if (user.role === "driver") {
                  console.log(`Item ${item.id}: driver=${item.id_driver}, user=${user.id}, match=${item.id_driver === user.id}`);
                }
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{pelangganDetail?.nama || item.nama_pelanggan || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama_kasir || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama_driver || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.produk && item.produk.length > 0 ? (
                        <ul className="list-disc ml-4">
                          {item.produk.map((prod, idx) => (
                            <li key={idx}>
                              {(prod.nama_produk || prod.id_produk) + ' x' + prod.jumlah + ' = ' + formatRupiah(prod.subtotal)}
                            </li>
                          ))}
                        </ul>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatRupiah(item.ongkir || 0)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatRupiah(item.total_bayar)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.tanggal ? new Date(item.tanggal).toLocaleString('id-ID') : '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.status || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                      {/* Tombol Selesai - hanya untuk admin, kasir, atau driver yang ditugaskan */}
                      {(user.role === "admin" || user.role === "kasir" || 
                        (user.role === "driver" && item.id_driver === user.id)) && 
                        item.status !== "Selesai" && (
                        <button
                          onClick={() => handleSelesai(item)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                        >
                          Selesai
                        </button>
                      )}
                      
                      {/* Tombol Cetak - untuk admin, kasir, atau driver yang ditugaskan */}
                      {(user.role === "admin" || user.role === "kasir" || 
                        (user.role === "driver" && item.id_driver === user.id)) && (
                        <button
                          onClick={() => handleCetakStruk(item.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                        >
                          Cetak Struk
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border rounded-lg ${
                page === currentPage 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </Card>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Transaksi Baru</h2>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
            {/* Nama Kasir otomatis dari JWT, tidak bisa diubah */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Kasir</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
                value={form.nama_kasir}
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pelanggan</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.id_pelanggan}
                onChange={(e) => setForm({ ...form, id_pelanggan: e.target.value })}
              >
                <option value="">Pilih Pelanggan</option>
                {pelanggan.map((p) => (
                  <option key={p.id} value={p.id} className="text-black bg-white">
                    {p.nama} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Daftar Produk</label>
              {produkDipilih.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2 items-center">
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 w-1/3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={item.id_produk}
                    onChange={(e) => handleProdukChange(index, e.target.value)}
                  >
                    <option value="">Pilih Produk</option>
                    {produk
                      .filter((p) => p.id && p.nama_produk) // hanya produk valid
                      .map((p) => (
                        <option key={p.id} value={p.id} className="text-black bg-white">
                          {p.nama_produk} (Stok: {p.stok})
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    value={item.jumlah}
                    onChange={(e) => handleJumlahChange(index, e.target.value)}
                    placeholder="Qty"
                  />
                  <span className="w-1/3 text-sm font-medium">{formatRupiah(item.subtotal)}</span>
                  <button
                    onClick={() => handleRemoveProduk(index)}
                    className="ml-2 text-red-600 hover:text-red-800 font-bold"
                    title="Hapus Produk"
                  >
                    ❌
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddProduk}
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium"
              >
                + Tambah Produk
              </button>
            </div>


            {/* Jenis Pengiriman */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Pengiriman</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.jenis_pengiriman}
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ ...f, jenis_pengiriman: val, id_driver: "", nama_driver: "" }));
                  updateTotalBayar(produkDipilih, val);
                }}
              >
                <option value="">Pilih Jenis Pengiriman</option>
                <option value="motor">Motor (Rp 10.000)</option>
                <option value="mobil">Mobil (Rp 20.000)</option>
                <option value="ambil_sendiri">Ambil Sendiri (Gratis)</option>
              </select>
            </div>

            {/* Nama Driver jika motor/mobil */}
            {(form.jenis_pengiriman === "motor" || form.jenis_pengiriman === "mobil") && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Driver</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={form.id_driver}
                  onChange={e => {
                    const selected = drivers.find(d => d.id === e.target.value);
                    
                    // Validasi status driver
                    if (selected && selected.status === 'nonaktif') {
                      Swal.fire({
                        icon: "warning",
                        title: "Driver Tidak Aktif",
                        text: `Driver ${selected.nama} sedang dalam status non-aktif dan tidak dapat dipilih untuk pengiriman.`,
                        confirmButtonText: "OK",
                        customClass: {
                          confirmButton: "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600",
                        },
                        buttonsStyling: false,
                      });
                      // Reset pilihan driver
                      setForm(f => ({ ...f, id_driver: "", nama_driver: "" }));
                      return;
                    }
                    
                    setForm(f => ({ ...f, id_driver: selected ? selected.id : "", nama_driver: selected ? selected.nama : "" }));
                  }}
                  required
                >
                  <option value="">Pilih Driver</option>
                  {drivers.map((d) => (
                    <option 
                      key={d.id} 
                      value={d.id}
                      style={{
                        color: d.status === 'nonaktif' ? '#9CA3AF' : '#000000',
                        fontStyle: d.status === 'nonaktif' ? 'italic' : 'normal'
                      }}
                    >
                      {d.nama} ({d.id}) {d.status === 'nonaktif' ? '- Non Aktif' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ongkir:</label>
              <div className="text-lg font-semibold text-gray-800 mb-2">{formatRupiah(form.ongkir)}</div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Bayar:</label>
              <div className="text-xl font-bold text-blue-600">{formatRupiah(form.total_bayar)}</div>
            </div>

            </div>
            
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPopup(false);
                    setForm({
                      id_pelanggan: "",
                      tanggal: new Date(),
                      produk: [],
                      total_bayar: 0,
                    });
                    setProdukDipilih([]);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Proses Pembayaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Pembayaran;