import { useEffect, useState } from 'react'
import { decodeJWT } from '../utils/jwtDecode'
import AdminLayout from './AdminLayout'
import DriverLayout from './DriverLayout'
import KasirLayout from './KasirLayout'

const RoleBasedLayout = () => {
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const decoded = decodeJWT(token)
    setUserRole(decoded?.role || '')
  }, [])

  // Render layout berdasarkan role
  switch (userRole) {
    case 'admin':
      return <AdminLayout />
    case 'driver':
      return <DriverLayout />
    case 'kasir':
      return <KasirLayout />
    default:
      return <AdminLayout /> // fallback ke admin layout
  }
}

export default RoleBasedLayout
