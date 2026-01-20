import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { getAllProduk } from '../services/produkAPI'
import { getAllPelanggan } from '../services/pelangganAPI'
import { getAllPembayaran } from '../services/pembayaranAPI'
import { listPengiriman } from '../services/pengirimanAPI'
import { listTransaksi } from '../services/transaksiAPI'
import { getBestSellers } from '../services/laporanAPI'
import { useAuth } from '../hooks/useAuth'
import { CardGlass } from '../components/Card'
import RecentActivity from '../components/RecentActivity'
import { 
  ArrowTrendingUpIcon,
  ShoppingBagIcon,
  UsersIcon,
  BanknotesIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

const isSameDay = (ts, now) => {
  if (!ts) return false
  const d = new Date(ts)
  return d.toDateString() === now.toDateString()
}

const inLast7Days = (ts, now) => {
  if (!ts) return false
  const d = new Date(ts)
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)
  return d >= sevenDaysAgo && d <= now
}

const ModernDashboard = () => {
  const navigate = useNavigate()
  const { user, authKey } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.role === 'gudang') {
      navigate('/dashboard-gudang', { replace: true })
    }
  }, [user?.role, navigate])

  const [adminStats, setAdminStats] = useState({
    totalProduk: 0,
    totalPelanggan: 0,
    totalPendapatanToko: 0,
    totalTransaksi: 0,
    bestSellers: []
  })

  const [kasirStats, setKasirStats] = useState({
    pendapatanHariIni: 0,
    pendapatanMingguIni: 0,
    totalTransaksiHariIni: 0,
    bestSellers: []
  })

  const [driverStats, setDriverStats] = useState({
    ongkirHariIni: 0,
    ongkirMingguIni: 0,
    pengirimanAktif: 0,
    pengirimanSelesaiHariIni: 0
  })

  const fetchStats = useCallback(async () => {
    if (!user?.role) return
    if (user.role === 'gudang') return
    setLoading(true)
    setError('')
    try {
      const role = user.role
      const now = new Date()

      if (role === 'admin') {
        const [produk, pelanggan, transaksi, pembayaran, pengiriman, bestSellers] = await Promise.all([
          getAllProduk().catch(() => []),
          getAllPelanggan().catch(() => []),
          listTransaksi().catch(() => []),
          getAllPembayaran().catch(() => []),
          listPengiriman().catch(() => []),
          getBestSellers(7).catch(() => [])
        ])

        const ongkirByTrx = new Map()
        ;(Array.isArray(pengiriman) ? pengiriman : []).forEach((p) => {
          if (p?.transaksi_id) ongkirByTrx.set(p.transaksi_id, Number(p.ongkir || 0))
        })

        const pembayaranSelesai = (Array.isArray(pembayaran) ? pembayaran : []).filter(
          (p) => String(p?.status || '').toLowerCase() === 'selesai'
        )

        const totalPendapatanToko = pembayaranSelesai.reduce((sum, p) => {
          const total = Number(p?.total_bayar || 0)
          const ongkir = ongkirByTrx.get(p?.transaksi_id) || 0
          return sum + Math.max(0, total - ongkir)
        }, 0)

        setAdminStats({
          totalProduk: Array.isArray(produk) ? produk.length : 0,
          totalPelanggan: Array.isArray(pelanggan) ? pelanggan.length : 0,
          totalPendapatanToko,
          totalTransaksi: Array.isArray(transaksi) ? transaksi.length : 0,
          bestSellers: Array.isArray(bestSellers) ? bestSellers : []
        })
        return
      }

      if (role === 'kasir') {
        // IMPORTANT: data berasal dari API yang sudah ter-scope kasir (server-side)
        const [transaksi, pembayaran, pengiriman, bestSellers] = await Promise.all([
          listTransaksi().catch(() => []),
          getAllPembayaran().catch(() => []),
          listPengiriman().catch(() => []),
          getBestSellers(7).catch(() => [])
        ])

        const ongkirByTrx = new Map()
        ;(Array.isArray(pengiriman) ? pengiriman : []).forEach((p) => {
          if (p?.transaksi_id) ongkirByTrx.set(p.transaksi_id, Number(p.ongkir || 0))
        })

        const pembayaranSelesai = (Array.isArray(pembayaran) ? pembayaran : []).filter(
          (p) => String(p?.status || '').toLowerCase() === 'selesai'
        )

        const pendapatanHariIni = pembayaranSelesai
          .filter((p) => isSameDay(p?.created_at, now))
          .reduce((sum, p) => {
            const total = Number(p?.total_bayar || 0)
            const ongkir = ongkirByTrx.get(p?.transaksi_id) || 0
            return sum + Math.max(0, total - ongkir)
          }, 0)

        const pendapatanMingguIni = pembayaranSelesai
          .filter((p) => inLast7Days(p?.created_at, now))
          .reduce((sum, p) => {
            const total = Number(p?.total_bayar || 0)
            const ongkir = ongkirByTrx.get(p?.transaksi_id) || 0
            return sum + Math.max(0, total - ongkir)
          }, 0)

        const totalTransaksiHariIni = (Array.isArray(transaksi) ? transaksi : []).filter((t) =>
          isSameDay(t?.created_at, now)
        ).length

        setKasirStats({
          pendapatanHariIni,
          pendapatanMingguIni,
          totalTransaksiHariIni,
          bestSellers: Array.isArray(bestSellers) ? bestSellers : []
        })
        return
      }

      if (role === 'driver') {
        // IMPORTANT: data berasal dari API yang sudah ter-scope driver (server-side)
        const pengiriman = await listPengiriman().catch(() => [])
        const list = Array.isArray(pengiriman) ? pengiriman : []

        const statusLower = (s) => String(s || '').toLowerCase()
        const ts = (p) => p?.updated_at || p?.created_at

        const ongkirHariIni = list
          .filter((p) => isSameDay(ts(p), now))
          .reduce((sum, p) => sum + Number(p?.ongkir || 0), 0)

        const ongkirMingguIni = list
          .filter((p) => inLast7Days(ts(p), now))
          .reduce((sum, p) => sum + Number(p?.ongkir || 0), 0)

        const pengirimanSelesaiHariIni = list.filter(
          (p) => statusLower(p?.status) === 'selesai' && isSameDay(ts(p), now)
        ).length

        const pengirimanAktif = list.filter((p) => {
          const st = statusLower(p?.status)
          return st !== 'selesai' && st !== 'batal'
        }).length

        setDriverStats({
          ongkirHariIni,
          ongkirMingguIni,
          pengirimanAktif,
          pengirimanSelesaiHariIni
        })
        return
      }
    } catch (e) {
      console.error('Error fetching dashboard stats:', e)
      setError('Gagal memuat dashboard')
    } finally {
      setLoading(false)
    }
  }, [authKey, user?.role])

  // IMPORTANT: reset state ketika user/token berubah (mencegah state terbawa antar user)
  useEffect(() => {
    setAdminStats({
      totalProduk: 0,
      totalPelanggan: 0,
      totalPendapatanToko: 0,
      totalTransaksi: 0,
      bestSellers: []
    })
    setKasirStats({
      pendapatanHariIni: 0,
      pendapatanMingguIni: 0,
      totalTransaksiHariIni: 0,
      bestSellers: []
    })
    setDriverStats({
      ongkirHariIni: 0,
      ongkirMingguIni: 0,
      pengirimanAktif: 0,
      pengirimanSelesaiHariIni: 0
    })
    setError('')
    setLoading(false)
  }, [authKey])

  useEffect(() => {
    if (user?.role) fetchStats()
  }, [authKey, user?.role, fetchStats])

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

  const AdminCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      <CardGlass>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-3 rounded-lg"><ShoppingBagIcon className="w-6 h-6 text-white" /></div>
          <div>
            <p className="text-sm text-white/80">Total Produk</p>
            <p className="text-xl font-semibold text-white">{adminStats.totalProduk}</p>
          </div>
        </div>
      </CardGlass>
      <CardGlass>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-3 rounded-lg"><UsersIcon className="w-6 h-6 text-white" /></div>
          <div>
            <p className="text-sm text-white/80">Total Pelanggan</p>
            <p className="text-xl font-semibold text-white">{adminStats.totalPelanggan}</p>
          </div>
        </div>
      </CardGlass>
      <CardGlass>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-3 rounded-lg"><BanknotesIcon className="w-6 h-6 text-white" /></div>
          <div>
            <p className="text-sm text-white/80">Total Pendapatan Toko</p>
            <p className="text-xl font-semibold text-white">{formatRupiah(adminStats.totalPendapatanToko)}</p>
          </div>
        </div>
      </CardGlass>
      <CardGlass>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-3 rounded-lg"><ArrowTrendingUpIcon className="w-6 h-6 text-white" /></div>
          <div>
            <p className="text-sm text-white/80">Total Transaksi</p>
            <p className="text-xl font-semibold text-white">{adminStats.totalTransaksi}</p>
          </div>
        </div>
      </CardGlass>
    </div>
  )

  const KasirCards = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <CardGlass>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Pendapatan Hari Ini</h2>
          <BanknotesIcon className="w-5 h-5 text-white/60" />
        </div>
        <p className="text-2xl font-bold text-white">{formatRupiah(kasirStats.pendapatanHariIni)}</p>
        <p className="text-sm text-white/70">Kasir ini saja</p>
      </CardGlass>
      <CardGlass>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Pendapatan Minggu Ini</h2>
          <BanknotesIcon className="w-5 h-5 text-white/60" />
        </div>
        <p className="text-2xl font-bold text-white">{formatRupiah(kasirStats.pendapatanMingguIni)}</p>
        <p className="text-sm text-white/70">7 hari terakhir</p>
      </CardGlass>
      <CardGlass>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Transaksi Hari Ini</h2>
          <ArrowTrendingUpIcon className="w-5 h-5 text-white/60" />
        </div>
        <p className="text-2xl font-bold text-white">{kasirStats.totalTransaksiHariIni}</p>
        <p className="text-sm text-white/70">Kasir ini saja</p>
      </CardGlass>
      <CardGlass>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Produk Terlaris</h2>
          <ShoppingBagIcon className="w-5 h-5 text-white/60" />
        </div>
        <p className="text-sm text-white/70">Versi kasir ini</p>
      </CardGlass>
    </div>
  )

  const DriverCards = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <CardGlass>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Ongkir Hari Ini</h2>
          <BanknotesIcon className="w-5 h-5 text-white/60" />
        </div>
        <p className="text-2xl font-bold text-white">{formatRupiah(driverStats.ongkirHariIni)}</p>
        <p className="text-sm text-white/70">Driver ini saja</p>
      </CardGlass>
      <CardGlass>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Ongkir Minggu Ini</h2>
          <BanknotesIcon className="w-5 h-5 text-white/60" />
        </div>
        <p className="text-2xl font-bold text-white">{formatRupiah(driverStats.ongkirMingguIni)}</p>
        <p className="text-sm text-white/70">7 hari terakhir</p>
      </CardGlass>
      <CardGlass>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Pengiriman Aktif</h2>
          <TruckIcon className="w-5 h-5 text-white/60" />
        </div>
        <p className="text-2xl font-bold text-white">{driverStats.pengirimanAktif}</p>
        <p className="text-sm text-white/70">Assigned ke driver ini</p>
      </CardGlass>
      <CardGlass>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Selesai Hari Ini</h2>
          <ArrowTrendingUpIcon className="w-5 h-5 text-white/60" />
        </div>
        <p className="text-2xl font-bold text-white">{driverStats.pengirimanSelesaiHariIni}</p>
        <p className="text-sm text-white/70">Driver ini saja</p>
      </CardGlass>
    </div>
  )

  return (
    <div className="space-y-6 text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          {user?.role === 'admin' ? (
            <>
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard Admin</h1>
              <p className="text-white/80">Monitoring Bisnis (Read-Only)</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-white/80">Selamat datang di sistem manajemen bisnis mikro</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <CardGlass>
          <p className="text-white">{error}</p>
        </CardGlass>
      )}

      {loading && !error && (
        <CardGlass>
          <p className="text-white/80">Memuat data dashboard...</p>
        </CardGlass>
      )}

      {!loading && !error && user.role === 'admin' && <AdminCards />}
      {!loading && !error && user.role === 'kasir' && <KasirCards />}
      {!loading && !error && user.role === 'driver' && <DriverCards />}
      {!loading && !error && user.role === 'gudang' && (
        <CardGlass>
          <p className="text-white/80">Dashboard gudang belum didefinisikan pada spesifikasi ini.</p>
        </CardGlass>
      )}

      {/* Quick Actions removed per request */}

      {/* Charts Section */}

      {!loading && !error && (user.role === 'admin' || user.role === 'kasir') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardGlass>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Produk Terlaris</h2>
                <p className="text-xs text-white/70">Berdasarkan jumlah item terjual</p>
              </div>
              <ShoppingBagIcon className="w-5 h-5 text-white/60" />
            </div>

            {(() => {
              const list = user.role === 'admin' ? adminStats.bestSellers : kasirStats.bestSellers
              if (!Array.isArray(list) || list.length === 0) {
                return (
                  <div className="text-center py-8">
                    <ShoppingBagIcon className="w-12 h-12 text-white/60 mx-auto mb-3" />
                    <p className="text-white/70">Belum ada data penjualan produk</p>
                  </div>
                )
              }
              const top = list[0]?.jumlah || 1
              return (
                <div className="space-y-3">
                  {list.slice(0, 5).map((p, index) => (
                    <div key={p.produk_id || p.nama || index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">{index + 1}</span>
                        </div>
                        <span className="text-sm font-medium text-white/90">{p.nama}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-white/15 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((Number(p.jumlah || 0) / Number(top)) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-white/90">{p.jumlah}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </CardGlass>

          {user.role === 'admin' && (
            <RecentActivity maxItems={5} showStats={false} hideControls={true} privacyMode="admin" className="" />
          )}
        </div>
      )}
    </div>
  )
}

export default ModernDashboard
