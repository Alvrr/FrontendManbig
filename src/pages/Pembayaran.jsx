// pages/Pembayaran.jsx
import React, { useEffect, useState } from "react";
import { decodeJWT } from "../utils/jwtDecode";
import { getAllPembayaran, createPembayaran } from "../services/pembayaranAPI";
import { listTransaksi } from "../services/transaksiAPI";
import { getAllPelanggan } from "../services/pelangganAPI";
import { getAllDrivers } from "../services/driverAPI";
import { createPengiriman } from "../services/pengirimanAPI";
import Swal from "sweetalert2";
import axiosInstance from "../services/axiosInstance";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/Card";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { formatRupiah } from "../utils/currency";

const Pembayaran = () => {
  const [pembayaran, setPembayaran] = useState([]);
  const [user, setUser] = useState({ role: '', id: '' });
  const [transaksiList, setTransaksiList] = useState([]);
  const [pelangganList, setPelangganList] = useState([]);
  const [driverList, setDriverList] = useState([]);
  const [baseTotal, setBaseTotal] = useState(0); // total transaksi sebelum ongkir
  const [ongkir, setOngkir] = useState(0); // ongkir berdasarkan kendaraan
  const [form, setForm] = useState({
    transaksi_id: "",
    metode: "cash",
    total_bayar: 0,
    delivery: false,
    jenis_kendaraan: "mobil",
    driver_id: "",
  });
  const [showPopup, setShowPopup] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    // Ambil role, id, dan nama user dari JWT
    const token = localStorage.getItem('token');
    const decoded = decodeJWT(token);
    setUser({ role: decoded?.role || '', id: decoded?.id || '', nama: decoded?.nama || '' });
    fetchPembayaran();
    fetchTransaksi();
    fetchMasters();
    // Disesuaikan: halaman pembayaran mengikuti skema baru
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fetchTransaksi = async () => {
    try {
      const data = await listTransaksi();
      // Filter hanya transaksi aktif jika diperlukan
      const aktif = Array.isArray(data) ? data.filter(t => t && t.status !== 'Selesai') : [];
      setTransaksiList(aktif);
    } catch (e) {
      console.error('Gagal fetch transaksi:', e);
    }
  };

  const fetchMasters = async () => {
    try {
      const [pel, drv] = await Promise.all([getAllPelanggan(), getAllDrivers()]);
      setPelangganList(Array.isArray(pel) ? pel : []);
      setDriverList(Array.isArray(drv) ? drv : []);
    } catch (e) {
      // ignore for now
    }
  };

  const fetchPembayaran = async () => {
    const data = await getAllPembayaran();
    console.log('Fetched pembayaran data:', data); // Debug log
    console.log('Current user:', user); // Debug log
    setPembayaran(data);
  };

  // Re-calc ongkir setiap jenis kendaraan berubah atau delivery on/off
  useEffect(() => {
    const tarif = form.jenis_kendaraan === 'mobil' ? 25000 : 10000;
    const currentOngkir = form.delivery ? tarif : 0;
    setOngkir(currentOngkir);
  }, [form.delivery, form.jenis_kendaraan]);

  // Saat transaksi berubah, set baseTotal dari transaksi terpilih
  useEffect(() => {
    const trx = transaksiList.find(t => t.id === form.transaksi_id);
    const tot = Number(trx?.total_harga ?? trx?.total ?? 0);
    setBaseTotal(tot);
  }, [form.transaksi_id, transaksiList]);

  // Sinkronkan total_bayar otomatis = baseTotal + ongkir
  useEffect(() => {
    setForm(f => ({ ...f, total_bayar: Number(baseTotal) + Number(ongkir) }));
  }, [baseTotal, ongkir]);

  // Hapus seluruh handler terkait produk karena tidak digunakan pada skema baru

  const updateTotalBayar = (val) => {
    setForm(f => ({ ...f, total_bayar: Number(val) || 0 }));
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
    if (!form.transaksi_id || !form.total_bayar || form.total_bayar <= 0) {
      await Swal.fire({
        icon: "warning",
        title: "Data tidak lengkap",
        text: "Pilih transaksi dan isi total bayar dengan benar",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600",
        },
        buttonsStyling: false,
      });
      return;
    }

    // Tidak ada validasi produk pada skema pembayaran baru

    const confirm = await Swal.fire({
      title: "Yakin ingin menyimpan pembayaran ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, simpan",
      cancelButtonText: "Batal",
      customClass: {
        confirmButton: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700",
        cancelButton: "btn-secondary-glass px-4 py-2",
      },
      buttonsStyling: false,
    });

    if (!confirm.isConfirmed) return;

    try {
      const data = {
        transaksi_id: form.transaksi_id,
        metode: form.metode,
        total_bayar: Number(baseTotal) + Number(ongkir),
        status: "pending",
      };

      console.log('Data pembayaran yang akan disimpan:', data);

      if (form.delivery && !form.driver_id) {
        await Swal.fire({ icon: 'warning', title: 'Driver belum dipilih', text: 'Pilih driver untuk pengiriman', confirmButtonText: 'OK', buttonsStyling: false, customClass: { confirmButton: 'bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600' } });
        return;
      }

      const response = await createPembayaran(data);
      console.log('Response pembayaran:', response.data);

      // Optional: buat pengiriman jika delivery dipilih
      if (form.delivery && form.driver_id) {
        try {
          await createPengiriman({
            transaksi_id: form.transaksi_id,
            driver_id: form.driver_id,
            jenis: form.jenis_kendaraan,
            ongkir: Number(ongkir),
          });
        } catch (e) {
          console.warn('Gagal membuat pengiriman:', e?.response?.data || e);
        }
      }

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
      setShowPopup(false);
      setForm({ transaksi_id: "", metode: "cash", total_bayar: 0, delivery: false, jenis_kendaraan: "mobil", driver_id: "" });
      setBaseTotal(0);
      setOngkir(0);
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
        cancelButton: "btn-secondary-glass px-4 py-2",
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

  // Cetak struk dihapus sesuai backend baru

  // gunakan util bersama

  // Defensive: pembayaran always array
  const pembayaranArr = Array.isArray(pembayaran) ? pembayaran : [];
  // Filter transaksi aktif (status !== 'Selesai')
  const transaksiAktif = pembayaranArr.filter(item => item && (item.status || '').toLowerCase() !== 'selesai');
  // Filter sesuai role - sama seperti implementasi driver
  const transaksiTampil = user.role === 'kasir'
    ? transaksiAktif.filter(item => item && item.kasir_id === user.id)
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
            <MagnifyingGlassIcon className="w-5 h-5 text-white/60 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ID Pembayaran..."
              value={searchId}
              onChange={(e) => {
                setSearchId(e.target.value);
                setCurrentPage(1);
              }}
              className="input-glass w-full pl-10 pr-4 py-2"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>


        <div className="overflow-x-auto">
          <table className="table-glass min-w-full">
            <thead className="thead-glass">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Transaksi</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Metode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Total Bayar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="tbody-glass">
              {paginatedData.map((item) => {
                // Disesuaikan: tidak lagi menampilkan pelanggan/driver pada tabel pembayaran
                
                return (
                  <tr key={item.id} className="row-glass">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white/90">{item.id}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white/90">{item.transaksi_id}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white/90">{item.metode || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white/90">{formatRupiah(item.total_bayar)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white/90">{item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white/90">{item.status || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                      {/* Tombol Selesai - hanya untuk admin, kasir, atau driver yang ditugaskan */}
                        {(user.role === "admin" || user.role === "kasir") && 
                        item.status !== "Selesai" && (
                        <button
                          onClick={() => handleSelesai(item)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                        >
                          Selesai
                        </button>
                      )}
                      
                      {/* Tombol Cetak - untuk admin, kasir, atau driver yang ditugaskan */}
                        {/* Cetak Struk dihapus sesuai backend baru */}
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
                  : "btn-secondary-glass"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </Card>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-glass backdrop-blur-md rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Transaksi Baru</h2>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
            {/* Form sederhana sesuai skema pembayaran baru */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/80 mb-2">Pilih Transaksi</label>
              <select
                className="input-glass w-full px-3 py-2"
                value={form.transaksi_id}
                onChange={(e) => setForm(f => ({ ...f, transaksi_id: e.target.value }))}
              >
                <option value="">-- Pilih Transaksi --</option>
                {transaksiList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} - {t.pelanggan_id || 'unknown'} ({t.status}) • {formatRupiah(t.total_harga || t.total || 0)}
                  </option>
                ))}
              </select>
            </div>
            {/* Ringkasan total dan ongkir */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Total Transaksi</label>
                <input className="input-glass w-full px-3 py-2 opacity-70" value={formatRupiah(baseTotal)} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Ongkir</label>
                <input className="input-glass w-full px-3 py-2 opacity-70" value={formatRupiah(ongkir)} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Total Bayar</label>
                <input
                  className="input-glass w-full px-3 py-2 opacity-70"
                  value={formatRupiah(form.total_bayar)}
                  readOnly
                />
              </div>
            </div>
            {/* Opsi Delivery */}
            <div className="mb-4">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={form.delivery} onChange={e => setForm(f => ({ ...f, delivery: e.target.checked }))} />
                <span className="text-white/80">Butuh Pengiriman (Delivery)</span>
              </label>
            </div>
            {form.delivery && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Jenis Kendaraan</label>
                  <select className="input-glass w-full px-3 py-2" value={form.jenis_kendaraan} onChange={e => setForm(f => ({ ...f, jenis_kendaraan: e.target.value }))}>
                    <option value="mobil">Mobil</option>
                    <option value="motor">Motor</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-2">Pilih Driver</label>
                  <select className="input-glass w-full px-3 py-2" value={form.driver_id} onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))}>
                    <option value="">-- Pilih Driver --</option>
                    {driverList.map(d => (
                      <option key={d.id} value={d.id}>{d.nama || d.email || d.id}</option>
                    ))}
                  </select>
                  {/* Alamat Pelanggan tampil otomatis dari transaksi terpilih */}
                  <div className="mt-2 text-sm text-white/70">
                    {(() => {
                      const trx = transaksiList.find(t => t.id === form.transaksi_id);
                      const pel = pelangganList.find(p => p.id === trx?.pelanggan_id);
                      if (!trx || !pel) return null;
                      return (
                        <div className="pt-1">
                          <div><span className="font-medium">Penerima:</span> {pel.nama} ({pel.id})</div>
                          <div><span className="font-medium">Alamat:</span> {pel.alamat || '-'}</div>
                          <div><span className="font-medium">Kendaraan:</span> {form.jenis_kendaraan} • <span className="font-medium">Driver:</span> {driverList.find(d => d.id === form.driver_id)?.nama || '-'}</div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/80 mb-2">Metode</label>
              <select
                className="input-glass w-full px-3 py-2"
                value={form.metode}
                onChange={(e) => setForm(f => ({ ...f, metode: e.target.value }))}
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="qris">QRIS</option>
              </select>
            </div>
            {/* Total Bayar otomatis dari total transaksi + ongkir */}

            </div>
            
            <div className="p-6 border-t border-white/10 flex-shrink-0">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPopup(false);
                    setForm({ transaksi_id: "", metode: "cash", total_bayar: 0 });
                  }}
                  className="btn-secondary-glass px-4 py-2 font-medium"
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