// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import RoleBasedLayout from './components/RoleBasedLayout'
import ModernDashboard from './pages/ModernDashboard'
import Produk from './pages/Produk'
import Pelanggan from './pages/Pelanggan'
import Pembayaran from './pages/Pembayaran'
import Laporan from './pages/Laporan'
import Riwayat from './pages/Riwayat'
import Karyawan from './pages/DataKaryawan'
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Route login dan register tanpa proteksi */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Semua halaman lain wajib login */}
        <Route element={<ProtectedRoute><RoleBasedLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<ModernDashboard />} />
          <Route path="/produk" element={<Produk />} />
          <Route path="/pelanggan" element={<Pelanggan />} />
          <Route path="/pembayaran" element={<Pembayaran />} />
          <Route path="/riwayat" element={<Riwayat />} />
          {/* Laporan hanya untuk admin */}
          <Route path="/laporan" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Laporan />
            </ProtectedRoute>
          } />
          {/* Data Karyawan hanya untuk admin */}
          <Route path="/karyawan" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Karyawan />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
