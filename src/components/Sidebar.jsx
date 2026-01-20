import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  CubeIcon, 
  UserGroupIcon, 
  CreditCardIcon, 
  ClockIcon,
  DocumentTextIcon,
  UsersIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'

const Sidebar = ({ isOpen }) => {
  const location = useLocation()

  // IMPORTANT: role diambil dari auth context (bersumber dari JWT)
  // agar menu yang tidak diizinkan tidak pernah dirender.
  const { user } = useAuth()
  const userRole = user?.role || ''

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: HomeIcon,
      roles: ['admin', 'kasir', 'driver', 'gudang']
    },
    {
      name: 'Produk',
      path: '/produk',
      icon: CubeIcon,
      // IMPORTANT: driver tidak boleh lihat menu Produk
      roles: ['kasir', 'gudang']
    },
    {
      name: 'Pelanggan',
      path: '/pelanggan',
      icon: UserGroupIcon,
      roles: ['kasir']
    },
    {
      name: 'Transaksi',
      path: '/transaksi',
      icon: ClockIcon,
      // IMPORTANT: sesuai aturan UI, transaksi hanya muncul untuk kasir
      roles: ['kasir']
    },
    {
      name: 'Pembayaran',
      path: '/pembayaran',
      icon: CreditCardIcon,
      // IMPORTANT: admin tidak operasional; pembayaran hanya untuk kasir
      roles: ['kasir']
    },
    {
      name: 'Pengiriman',
      path: '/pengiriman',
      icon: TruckIcon,
      // IMPORTANT: admin tidak operasional; pengiriman untuk driver (update) & kasir (read-only)
      roles: ['kasir', 'driver']
    },
    {
      name: 'Kategori',
      path: '/kategori',
      icon: CubeIcon,
      // IMPORTANT: menu gudang tidak boleh bocor ke admin/kasir/driver
      roles: ['gudang']
    },
    {
      name: 'Stok',
      path: '/stok',
      icon: CubeIcon,
      // IMPORTANT: menu gudang tidak boleh bocor ke admin/kasir/driver
      roles: ['gudang']
    },
    {
      name: 'Riwayat Stok',
      path: '/riwayat-stok',
      icon: DocumentTextIcon,
      // IMPORTANT: menu gudang tidak boleh bocor ke admin/kasir/driver
      roles: ['gudang']
    },
    {
      name: 'Laporan',
      path: '/laporan',
      icon: DocumentTextIcon,
      roles: ['admin']
    },
    {
      name: 'Data Karyawan',
      path: '/karyawan',
      icon: UsersIcon,
      roles: ['admin']
    }
  ]

  // Filter menu berdasarkan role user
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <div className={`fixed left-0 top-0 h-full bg-slate-950/70 backdrop-blur-md border-r border-white/10 text-white shadow-lg transition-all duration-300 z-40 ${
      isOpen ? 'w-64' : 'w-20'
    }`}>
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 shadow-lg hover:shadow-2xl ring-1 ring-inset ring-white/20 dark:ring-white/10 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 flex items-center justify-center overflow-hidden transform-gpu transition-all duration-300 hover:scale-105 hover:-rotate-1">
            {/* Gloss overlay */}
            <span className="absolute inset-0 bg-white/10 mix-blend-overlay pointer-events-none"></span>
            {/* Accent dot */}
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900"></span>
            {/* Soft glow */}
            <span className="absolute -inset-6 bg-cyan-300/20 blur-2xl rounded-full pointer-events-none" />
            {/* Shopping bag mark */}
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-white/95 drop-shadow">
              <defs>
                <linearGradient id="logoStroke" x1="0" x2="1">
                  <stop offset="0%" stopColor="white" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="white" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <path
                d="M7 9h10l-1 9H8L7 9z"
                fill="none"
                stroke="url(#logoStroke)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 9V7.8a2.5 2.5 0 0 1 5 0V9"
                fill="none"
                stroke="url(#logoStroke)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* subtle check to imply purchase */}
              <path
                d="M14.8 13.5l-2.1 2.1-1.2-1.2"
                fill="none"
                stroke="url(#logoStroke)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            </svg>
          </div>
          {isOpen && (
            <span className="text-xl font-bold text-white">Bisnis Grosir</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-white/10 text-white border-l-2 border-sky-400'
                      : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  {isOpen && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      {isOpen && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-sm text-white/80 text-center">
              Manajemen Bisnis Grosir
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
