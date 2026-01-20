import { UserCircleIcon, Bars3Icon, ChevronDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { showLogoutConfirmAlert, showTimedSuccessAlert, showErrorAlert } from '../utils/alertUtils'

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  const userRole = user?.role || ''
  const userName = user?.nama || ''

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Function untuk mendapatkan title berdasarkan role
  const getDashboardTitle = () => {
    switch (userRole) {
      case 'admin':
        return 'Dashboard Admin'
      case 'driver':
        return 'Dashboard Driver'
      case 'kasir':
        return 'Dashboard Kasir'
      default:
        return 'Dashboard'
    }
  }

  // Function untuk mendapatkan role display name
  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'admin':
        return 'Administrator'
      case 'driver':
        return 'Driver'
      case 'kasir':
        return 'Kasir'
      default:
        return 'User'
    }
  }

  // Function untuk mendapatkan user display name
  const getUserDisplayName = () => {
    // Menampilkan nama dari database, fallback ke role jika nama kosong
    return userName || `${userRole || 'User'}`
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      const result = await showLogoutConfirmAlert()

      if (result.isConfirmed) {
        logout()
        await showTimedSuccessAlert(
          'Logout berhasil',
          'Anda telah berhasil keluar'
        )
        navigate('/login')
      }
    } catch {
      await showErrorAlert(
        'Error',
        'Terjadi kesalahan saat logout'
      )
    }
  }

  return (
    <header className={`fixed top-0 left-0 right-0 bg-slate-950/70 backdrop-blur-md border-b border-white/10 h-16 z-30 transition-all duration-300 text-white ${
      isSidebarOpen ? 'pl-64' : 'pl-20'
    }`}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side - Menu toggle */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          
          {/* Title removed per request */}
        </div>

        {/* Right side - User Menu */}
        <div className="flex items-center space-x-4">
          {/* User Menu */}
          <div className="flex items-center space-x-3" ref={dropdownRef}>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">{getUserDisplayName()}</p>
              <p className="text-xs text-white/70">{getRoleDisplayName()}</p>
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <UserCircleIcon className="w-8 h-8 text-white/80" />
                <ChevronDownIcon className={`w-4 h-4 text-white/70 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-950 text-white rounded-md shadow-lg border border-white/10 z-50">
                  <div className="py-1">
                    {/* Profile Info dalam dropdown (untuk mobile) */}
                    <div className="px-4 py-2 border-b border-white/10 sm:hidden">
                      <p className="text-sm font-medium text-white">{getUserDisplayName()}</p>
                      <p className="text-xs text-white/70">{getRoleDisplayName()}</p>
                    </div>
                    
                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center space-x-2"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
