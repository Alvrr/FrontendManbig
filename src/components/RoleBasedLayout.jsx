import { useAuth } from '../hooks/useAuth'
import AdminLayout from './AdminLayout'
import DriverLayout from './DriverLayout'
import KasirLayout from './KasirLayout'

const RoleBasedLayout = () => {
  const { user } = useAuth()
  const userRole = user?.role || ''

  // Render layout berdasarkan role
  switch (userRole) {
    case 'admin':
      return <AdminLayout />
    case 'driver':
      return <DriverLayout />
    case 'kasir':
      return <KasirLayout />
    case 'gudang':
      return <AdminLayout />
    default:
      return <AdminLayout /> // fallback ke admin layout
  }
}

export default RoleBasedLayout
