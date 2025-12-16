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
import { useEffect, useState } from 'react'
import { decodeJWT } from '../utils/jwtDecode'

const Sidebar = ({ isOpen }) => {
  const location = useLocation()
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const decoded = decodeJWT(token)
    setUserRole(decoded?.role || '')
  }, [])

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
      roles: ['admin', 'kasir', 'driver', 'gudang']
    },
    {
      name: 'Pelanggan',
      path: '/pelanggan',
      icon: UserGroupIcon,
      roles: ['admin', 'kasir']
    },
    {
      name: 'Pembayaran',
      path: '/pembayaran',
      icon: CreditCardIcon,
      roles: ['admin', 'kasir'] // Hanya admin/kasir sesuai backend
    },
    {
      name: 'Pengiriman',
      path: '/pengiriman',
      icon: TruckIcon,
      roles: ['driver', 'admin'] // Driver dan Admin dapat mengakses pengiriman
    },
    {
      name: 'Kategori',
      path: '/kategori',
      icon: CubeIcon,
      roles: ['gudang', 'admin']
    },
    {
      name: 'Stok',
      path: '/stok',
      icon: CubeIcon,
      roles: ['gudang', 'admin']
    },
    {
      name: 'Transaksi',
      path: '/transaksi',
      icon: ClockIcon,
      roles: ['admin', 'kasir']
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
    <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${
      isOpen ? 'w-64' : 'w-20'
    }`}>
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">BG</span>
          </div>
          {isOpen && (
            <span className="text-xl font-bold text-gray-800">Bisnis Grosir</span>
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
                      ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 text-center">
              Bisnis farid & hilmi
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
