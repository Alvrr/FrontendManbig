import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { getAllProduk } from '../services/produkAPI';
import { getAllPelanggan } from '../services/pelangganAPI';
import { getAllPembayaran } from '../services/pembayaranAPI';
import { decodeJWT } from '../utils/jwtDecode';
import Card from '../components/Card'
import RecentActivity from '../components/RecentActivity'
import { 
  CubeIcon, 
  UserGroupIcon, 
  CreditCardIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  ShoppingBagIcon,
  UsersIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

const ModernDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState({ role: '', id: '' })
  const [stats, setStats] = useState({
    totalProduk: 0,
    totalPelanggan: 0,
    totalPembayaran: 0,
    totalPendapatan: 0,
    pembayaranHariIni: 0,
    produkTerlaris: []
  })

  const fetchStats = useCallback(async () => {
    try {
      let [produk, pelanggan, pembayaran] = await Promise.all([
        getAllProduk(),
        getAllPelanggan(),
        getAllPembayaran()
      ])
      // Defensive: if null, set to []
      produk = Array.isArray(produk) ? produk : [];
      pelanggan = Array.isArray(pelanggan) ? pelanggan : [];
      pembayaran = Array.isArray(pembayaran) ? pembayaran : [];

      // Filter pembayaran berdasarkan role - sama seperti implementasi driver dan kasir
      const filteredPembayaran = user.role === 'driver'
        ? pembayaran.filter(item => item && item.id_driver === user.id)
        : user.role === 'kasir'
        ? pembayaran.filter(item => item && item.id_kasir === user.id)
        : pembayaran;

      const totalPendapatan = filteredPembayaran.reduce((sum, item) => sum + (item?.total_bayar || 0), 0)
      
      const today = new Date().toISOString().split('T')[0]
      const pembayaranHariIni = filteredPembayaran.filter(item => 
        item?.tanggal && item.tanggal.startsWith(today)
      ).length

      // Hitung produk terlaris berdasarkan data yang sudah difilter
      const produkCount = {}
      filteredPembayaran.forEach(payment => {
        if (payment?.produk) {
          payment.produk.forEach(item => {
            const key = item?.nama_produk || item?.id_produk
            if (!key) return;
            produkCount[key] = (produkCount[key] || 0) + (item?.jumlah || 1)
          })
        }
      })

      const produkTerlaris = Object.entries(produkCount)
        .map(([nama, jumlah]) => ({ nama, jumlah }))
        .sort((a, b) => b.jumlah - a.jumlah)
        .slice(0, 5)

      setStats({
        totalProduk: produk.length,
        totalPelanggan: pelanggan.length,
        totalPembayaran: filteredPembayaran.length,
        totalPendapatan,
        pembayaranHariIni,
        produkTerlaris
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }, [user.role, user.id])

  useEffect(() => {
    // Ambil role dan id user dari JWT
    const token = localStorage.getItem('token');
    const decoded = decodeJWT(token);
    setUser({ role: decoded?.role || '', id: decoded?.id || '' });
  }, [])

  useEffect(() => {
    if (user.role) {
      fetchStats()
    }
  }, [user.role, user.id, fetchStats])

  const menuCards = [
    { 
      label: 'Produk', 
      path: '/produk', 
      icon: CubeIcon,
      description: 'Kelola data produk',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      label: 'Pelanggan', 
      path: '/pelanggan', 
      icon: UserGroupIcon,
      description: 'Kelola data pelanggan',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    { 
      label: 'Pembayaran', 
      path: '/pembayaran', 
      icon: CreditCardIcon,
      description: 'Kelola transaksi pembayaran',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      label: 'Riwayat', 
      path: '/riwayat', 
      icon: ClockIcon,
      description: 'Lihat riwayat transaksi',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
  ]

  const formatRupiah = (angka) => {
    if (angka >= 1000000000) {
      return `Rp ${(angka / 1000000000).toFixed(1)} M`
    } else if (angka >= 1000000) {
      return `Rp ${(angka / 1000000).toFixed(1)} Jt`
    } else if (angka >= 1000) {
      return `Rp ${(angka / 1000).toFixed(0)} Rb`
    } else {
      return `Rp ${angka.toLocaleString('id-ID')}`
    }
  }

  const statsCards = [
    {
      title: 'Total Produk',
      value: stats.totalProduk,
      icon: ShoppingBagIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      changeType: 'increase'
    },
    {
      title: 'Total Pelanggan',
      value: stats.totalPelanggan,
      icon: UsersIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      changeType: 'increase'
    },
    {
      title: 'Pembayaran Bulan Ini',
      value: formatRupiah(stats.totalPendapatan),
      fullValue: `Rp ${stats.totalPendapatan.toLocaleString('id-ID')}`,
      icon: BanknotesIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      changeType: 'increase'
    },
    {
      title: 'Transaksi Hari Ini',
      value: stats.pembayaranHariIni,
      icon: ArrowTrendingUpIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      changeType: 'increase'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Selamat datang di sistem manajemen bisnis mikro</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center p-1">
                <div className={`${stat.bgColor} p-3 rounded-lg flex-shrink-0`}>
                  <Icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                </div>
                <div className="ml-3 md:ml-4 flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                  <div className="flex items-center mt-1">
                    <p 
                      className="text-base md:text-lg lg:text-xl font-semibold text-gray-900 truncate"
                      title={stat.fullValue || stat.value}
                    >
                      {stat.value}
                    </p>
                    {stat.change && (
                      <span className={`ml-2 text-xs md:text-sm font-medium flex-shrink-0 ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                    )}
                  </div>
                  {stat.fullValue && stat.fullValue !== stat.value && (
                    <p className="text-xs text-gray-500 mt-1 truncate" title={stat.fullValue}>
                      {stat.fullValue}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu Utama</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuCards.map((item) => {
            const Icon = item.icon
            return (
              <Card 
                key={item.label}
                className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${item.bgColor} ${item.borderColor} border-2`}
                onClick={() => navigate(item.path)}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-white rounded-full shadow-sm">
                      <Icon className={`w-8 h-8 ${item.color}`} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.label}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produk Terlaris */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Produk Terlaris</h2>
            <ShoppingBagIcon className="w-5 h-5 text-gray-400" />
          </div>
          
          {stats.produkTerlaris.length > 0 ? (
            <div className="space-y-3">
              {stats.produkTerlaris.map((produk, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{produk.nama}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((produk.jumlah / stats.produkTerlaris[0]?.jumlah) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{produk.jumlah}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingBagIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada data penjualan produk</p>
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <RecentActivity 
          maxItems={5} 
          showStats={false}
          className=""
        />
        </div>
    </div>
  )
}

export default ModernDashboard
