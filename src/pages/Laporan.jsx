import React, { useEffect, useState } from "react"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { id } from "date-fns/locale"
import Swal from 'sweetalert2'
import { decodeJWT } from "../utils/jwtDecode"
import { getAllPembayaran } from "../services/pembayaranAPI"
import { listTransaksi } from "../services/transaksiAPI"
import { listPengiriman } from "../services/pengirimanAPI"
import { getAllPelanggan } from "../services/pelangganAPI"
import { getAllKaryawan } from "../services/karyawanAPI"
import { getAllDrivers } from "../services/driverAPI"
import { getAllProduk } from "../services/produkAPI"
import { formatRupiah } from "../utils/currency"
import PageWrapper from "../components/PageWrapper"
import Card from "../components/Card"
import { 
  DocumentArrowDownIcon, 
  MagnifyingGlassIcon,
  CalendarIcon,
  ChartBarIcon,
  FunnelIcon
} from "@heroicons/react/24/outline"

function Laporan() {
  const [transaksi, setTransaksi] = useState([])
  const [pelanggan, setPelanggan] = useState([])
  const [loading, setLoading] = useState(false)
  const [karyawan, setKaryawan] = useState([])
  const [drivers, setDrivers] = useState([])
  const [produk, setProduk] = useState([])
  
  // Filter states
  const [filterType, setFilterType] = useState('all') // all, custom, month, year
  const [customDateStart, setCustomDateStart] = useState('')
  const [customDateEnd, setCustomDateEnd] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [selectedYear, setSelectedYear] = useState(format(new Date(), 'yyyy'))
  const [searchId, setSearchId] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('token');
    const decoded = decodeJWT(token);
    
    if (decoded?.role !== 'admin') {
      Swal.fire({
        icon: "warning",
        title: "Akses Ditolak",
        text: "Halaman laporan hanya dapat diakses oleh admin.",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600",
        },
        buttonsStyling: false,
      }).then(() => {
        window.history.back();
      });
      return;
    }
    
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [pembayaranData, pelangganData, trxData, shipData, karyawanData, driverData, produkData] = await Promise.all([
        getAllPembayaran(),
        getAllPelanggan(),
        listTransaksi(),
        listPengiriman().catch(() => []),
        getAllKaryawan().catch(() => []),
        getAllDrivers().catch(() => []),
        getAllProduk().catch(() => [])
      ])

      setKaryawan(Array.isArray(karyawanData) ? karyawanData : (karyawanData?.data || []))
      setDrivers(Array.isArray(driverData) ? driverData : (driverData?.data || []))
      setProduk(Array.isArray(produkData) ? produkData : (produkData?.data || []))

      const karyawanMap = new Map((Array.isArray(karyawanData) ? karyawanData : (karyawanData?.data || [])).map(u => [u.id, u.nama]))
      const driverMap = new Map((Array.isArray(driverData) ? driverData : (driverData?.data || [])).map(d => [d.id, d.nama]))
      const pelangganMap = new Map((Array.isArray(pelangganData) ? pelangganData : []).map(p => [p.id, p.nama]))
      const produkMap = new Map((Array.isArray(produkData) ? produkData : (produkData?.data || [])).map(pr => [pr.id, pr]))

      const trxMap = new Map((Array.isArray(trxData) ? trxData : []).map(t => [t.id, t]))
      const shipByTrx = new Map()
      ;(Array.isArray(shipData) ? shipData : []).forEach(s => {
        if (!shipByTrx.has(s.transaksi_id)) shipByTrx.set(s.transaksi_id, s)
      })

      const rows = (Array.isArray(pembayaranData) ? pembayaranData : []).map(p => {
        const trx = trxMap.get(p.transaksi_id) || {}
        const ship = shipByTrx.get(p.transaksi_id) || {}
        const ongkir = ship.ongkir || 0
        const totalToko = Math.max(0, (p.total_bayar || 0) - ongkir)
        return {
          ...p,
          tanggal: trx.created_at || p.created_at,
          pelanggan_id: trx.pelanggan_id,
          kasir_id: trx.kasir_id,
          nama_pelanggan: pelangganMap.get(trx.pelanggan_id) || '',
          nama_kasir: karyawanMap.get(trx.kasir_id) || trx.kasir_id,
          nama_driver: driverMap.get(ship.driver_id) || ship.driver_id,
          jenis_pengiriman: ship.jenis,
          ongkir,
          total_toko: totalToko,
          produk: Array.isArray(trx.items) ? trx.items.map(it => ({
            nama_produk: it.nama_produk || produkMap.get(it.produk_id)?.nama_produk || produkMap.get(it.produk_id)?.nama || it.produk_id,
            id_produk: it.produk_id,
            jumlah: it.jumlah,
            harga: it.harga,
            subtotal: (Number(it.harga)||0)*(Number(it.jumlah)||0)
          })) : []
        }
      })

      // Exclude specific IDs from report per request
      const excludeIds = new Set(['PMB005', 'PMB004', 'PMB003', 'PMB002', 'PMB001'])
      const filteredRows = rows.filter(r => !excludeIds.has(String(r.id)))

      setTransaksi(filteredRows)
      setPelanggan(Array.isArray(pelangganData) ? pelangganData : [])
    } catch (error) {
      console.error("Error fetching data:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal memuat data laporan",
        confirmButtonText: "OK"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter data berdasarkan tanggal
  const getFilteredData = () => {
    let filtered = transaksi

    if (filterType === 'custom' && customDateStart && customDateEnd) {
      const startDate = new Date(customDateStart)
      const endDate = new Date(customDateEnd)
      endDate.setHours(23, 59, 59, 999) // Include the end date
      
      filtered = transaksi.filter(item => {
        if (!item.tanggal) return false
        const itemDate = new Date(item.tanggal)
        return itemDate >= startDate && itemDate <= endDate
      })
    } else if (filterType === 'month' && selectedMonth) {
      const [year, month] = selectedMonth.split('-')
      const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1))
      const endDate = endOfMonth(new Date(parseInt(year), parseInt(month) - 1))
      
      filtered = transaksi.filter(item => {
        if (!item.tanggal) return false
        const itemDate = new Date(item.tanggal)
        return itemDate >= startDate && itemDate <= endDate
      })
    } else if (filterType === 'year' && selectedYear) {
      const startDate = startOfYear(new Date(parseInt(selectedYear), 0))
      const endDate = endOfYear(new Date(parseInt(selectedYear), 0))
      
      filtered = transaksi.filter(item => {
        if (!item.tanggal) return false
        const itemDate = new Date(item.tanggal)
        return itemDate >= startDate && itemDate <= endDate
      })
    }

    // Search filter
    if (searchId) {
      filtered = filtered.filter(item => 
        item.id && item.id.toLowerCase().includes(searchId.toLowerCase())
      )
    }

    return filtered
  }

  const filteredData = getFilteredData()

  // Statistics from filtered data
  const stats = {
    totalTransaksi: filteredData.length,
    totalPendapatan: filteredData.reduce((sum, item) => sum + (item.total_toko || 0), 0),
    totalOngkir: filteredData.reduce((sum, item) => sum + (item.ongkir || 0), 0),
    transaksiSelesai: filteredData.filter(item => (item.status || '').toLowerCase() === 'selesai').length,
    transaksiPending: filteredData.filter(item => (item.status || '').toLowerCase() === 'pending').length
  }

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Tidak Ada Data",
        text: "Tidak ada data transaksi untuk diekspor",
        confirmButtonText: "OK"
      })
      return
    }

    const result = await Swal.fire({
      title: "Ekspor Laporan ke Excel",
      html: `
        <p>Data yang akan diekspor:</p>
        <ul style="text-align: left; margin: 10px 0;">
          <li><strong>${filteredData.length}</strong> transaksi</li>
          <li>Periode: <strong>${getPeriodText()}</strong></li>
          <li>Total Pendapatan: <strong>${formatRupiah(stats.totalPendapatan)}</strong></li>
        </ul>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Ekspor",
      cancelButtonText: "Batal",
      customClass: {
        confirmButton: "bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700",
        cancelButton: "bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500",
      },
      buttonsStyling: false,
    })

    if (result.isConfirmed) {
      try {
        const csvContent = generateExcelContent()
        downloadExcel(csvContent, `laporan-transaksi-${format(new Date(), 'yyyy-MM-dd')}.csv`)
        
        Swal.fire({
          icon: "success",
          title: "Ekspor Berhasil!",
          text: "Laporan telah berhasil diunduh",
          confirmButtonText: "OK",
          customClass: {
            confirmButton: "bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700",
          },
          buttonsStyling: false,
        })
      } catch (error) {
        console.error('Error exporting:', error)
        Swal.fire({
          icon: "error",
          title: "Gagal Ekspor",
          text: "Terjadi kesalahan saat mengekspor data",
          confirmButtonText: "OK"
        })
      }
    }
  }

  const generateExcelContent = () => {
    const headers = [
      'ID Transaksi', 'Tanggal', 'Waktu', 'Pelanggan', 'Kasir', 'Driver', 
      'Jenis Pengiriman', 'Nama Produk', 'Jumlah', 'Harga Satuan', 'Subtotal',
      'Ongkir', 'Total Bayar', 'Status'
    ]
    const csvRows = [headers.join(',')]

    const karyawanMap = new Map(karyawan.map(u => [u.id, u.nama]))
    const driverMap = new Map(drivers.map(d => [d.id, d.nama]))
    filteredData.forEach(item => {
      const pelangganDetail = pelanggan.find(p => p.id === (item.pelanggan_id || item.id_pelanggan))
      const pelangganNama = pelangganDetail?.nama || item.nama_pelanggan || (item.pelanggan_id || '') || 'N/A'
      const tanggal = item.tanggal ? format(new Date(item.tanggal), "dd/MM/yyyy") : 'N/A'
      const waktu = item.tanggal ? format(new Date(item.tanggal), "HH:mm:ss") : 'N/A'

      if (item.produk && item.produk.length > 0) {
        // Satu baris per produk
        item.produk.forEach(produk => {
          const row = [
            item.id || '',
            tanggal,
            waktu,
            pelangganNama,
            item.nama_kasir || karyawanMap.get(item.kasir_id) || 'N/A',
            item.nama_driver || driverMap.get(item.driver_id) || 'N/A',
            item.jenis_pengiriman || 'N/A',
            `"${produk.nama_produk || produk.id_produk || 'N/A'}"`,
            produk.jumlah || 0,
            produk.harga || 0,
            produk.subtotal || 0,
            item.ongkir || 0,
            item.total_bayar || 0,
            item.status || 'N/A'
          ]
          csvRows.push(row.join(','))
        })
      } else {
        // Jika tidak ada produk
        const row = [
          item.id || '',
          tanggal,
          waktu,
          pelangganNama,
          item.nama_kasir || karyawanMap.get(item.kasir_id) || item.kasir_id || 'N/A',
          item.nama_driver || driverMap.get(item.driver_id) || item.driver_id || 'N/A',
          item.jenis_pengiriman || 'N/A',
          'N/A',
          0,
          0,
          0,
          item.ongkir || 0,
          item.total_bayar || 0,
          item.status || 'N/A'
        ]
        csvRows.push(row.join(','))
      }
    })

    return csvRows.join('\\n')
  }

  const downloadExcel = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const getPeriodText = () => {
    if (filterType === 'custom' && customDateStart && customDateEnd) {
      return `${format(new Date(customDateStart), 'dd MMM yyyy')} - ${format(new Date(customDateEnd), 'dd MMM yyyy')}`
    } else if (filterType === 'month' && selectedMonth) {
      const [year, month] = selectedMonth.split('-')
      return format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy', { locale: id })
    } else if (filterType === 'year' && selectedYear) {
      return `Tahun ${selectedYear}`
    }
    return 'Semua Data'
  }

  // gunakan util bersama

  return (
    <PageWrapper 
      title="Laporan Transaksi" 
      description="Laporan lengkap transaksi pembayaran dengan fitur filter dan ekspor"
      action={
        <button
          onClick={handleExportExcel}
          disabled={loading || filteredData.length === 0}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          <span>Ekspor Excel</span>
        </button>
      }
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="col-span-1">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 flex-shrink-0">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 truncate">Total Transaksi</p>
              <p className="text-xl font-semibold text-gray-900">{stats.totalTransaksi}</p>
            </div>
          </div>
        </Card>

        <Card className="col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 flex-shrink-0">
              <DocumentArrowDownIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 truncate">Pendapatan Toko (tanpa ongkir)</p>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{formatRupiah(stats.totalPendapatan)}</p>
            </div>
          </div>
        </Card>

        <Card className="col-span-1">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 flex-shrink-0">
              <DocumentArrowDownIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 truncate">Total Ongkir</p>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{formatRupiah(stats.totalOngkir)}</p>
            </div>
          </div>
        </Card>

        {/* Kartu Rata-rata dihapus sesuai permintaan */}

        <Card className="col-span-1">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-emerald-100 flex-shrink-0">
              <ChartBarIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 truncate">Selesai</p>
              <p className="text-xl font-semibold text-gray-900">{stats.transaksiSelesai}</p>
            </div>
          </div>
        </Card>

        <Card className="col-span-1">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100 flex-shrink-0">
              <ChartBarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 truncate">Pending</p>
              <p className="text-xl font-semibold text-gray-900">{stats.transaksiPending}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card className="mb-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Filter Laporan</h3>
          </div>

          {/* Filter Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Filter</label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Data</option>
                <option value="custom">Rentang Tanggal</option>
                <option value="month">Per Bulan</option>
                <option value="year">Per Tahun</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {filterType === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={customDateStart}
                    onChange={(e) => {
                      setCustomDateStart(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={customDateEnd}
                    onChange={(e) => {
                      setCustomDateEnd(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {/* Month Selection */}
            {filterType === 'month' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Bulan</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Year Selection */}
            {filterType === 'year' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Tahun</label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[2024, 2025, 2026, 2027, 2028].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cari ID Transaksi</label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari ID..."
                  value={searchId}
                  onChange={(e) => {
                    setSearchId(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Period Info */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <span className="text-sm text-gray-600">
              <strong>Periode:</strong> {getPeriodText()}
            </span>
            <span className="text-sm text-gray-600">
              <strong>{filteredData.length}</strong> transaksi ditemukan
            </span>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data</h3>
            <p className="text-gray-500">Tidak ada transaksi yang sesuai dengan filter yang dipilih.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelanggan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kasir</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengiriman</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ongkir</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((item) => {
                    const pelangganDetail = pelanggan.find(p => p.id === (item.pelanggan_id || item.id_pelanggan))
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>{item.tanggal ? format(new Date(item.tanggal), "dd MMM yyyy", { locale: id }) : '-'}</div>
                            <div className="text-xs text-gray-500">{item.tanggal ? format(new Date(item.tanggal), "HH:mm") : ''}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pelangganDetail?.nama || item.nama_pelanggan || item.pelanggan_id || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama_kasir || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama_driver || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.jenis_pengiriman === 'motor' ? 'bg-blue-100 text-blue-800' :
                            item.jenis_pengiriman === 'mobil' ? 'bg-purple-100 text-purple-800' :
                            item.jenis_pengiriman === 'ambil_sendiri' ? 'bg-gray-100 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.jenis_pengiriman === 'motor' ? 'Motor' :
                             item.jenis_pengiriman === 'mobil' ? 'Mobil' :
                             item.jenis_pengiriman === 'ambil_sendiri' ? 'Ambil Sendiri' :
                             item.jenis_pengiriman || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {item.produk && item.produk.length > 0 ? (
                            <ul className="space-y-1">
                              {item.produk.map((produk, index) => (
                                <li key={index} className="text-xs">
                                  <div className="font-medium">{produk.nama_produk || produk.id_produk}</div>
                                  <div className="text-gray-500">{produk.jumlah}x @ {formatRupiah(produk.harga || 0)}</div>
                                </li>
                              ))}
                            </ul>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatRupiah(item.ongkir || 0)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatRupiah(item.total_toko || 0)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'Selesai' ? 'bg-green-100 text-green-800' :
                            item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status || '-'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
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
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </PageWrapper>
  )
}

export default Laporan
