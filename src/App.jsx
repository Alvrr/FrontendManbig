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
import PengirimanDriver from './pages/PengirimanDriver';
import Transaksi from './pages/Transaksi';
import Kategori from './pages/Kategori';
import Stok from './pages/Stok';
import RiwayatStok from './pages/RiwayatStok';

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
          <Route path="/transaksi" element={
            <ProtectedRoute requiredRoles={['admin','kasir']}>
              <Transaksi />
            </ProtectedRoute>
          } />
          <Route path="/riwayat" element={<Riwayat />} />
          {/* Halaman Gudang: Kategori dan Stok */}
          <Route path="/kategori" element={
            <ProtectedRoute requiredRoles={['gudang','admin']}>
              <Kategori />
            </ProtectedRoute>
          } />
          <Route path="/stok" element={
            <ProtectedRoute requiredRoles={['gudang','admin']}>
              <Stok />
            </ProtectedRoute>
          } />
          <Route path="/riwayat-stok" element={
            <ProtectedRoute requiredRoles={['gudang','admin']}>
              <RiwayatStok />
            </ProtectedRoute>
          } />
          {/* Pengiriman untuk driver dan admin */}
          <Route path="/pengiriman" element={
            <ProtectedRoute requiredRoles={['driver','admin']}>
              <PengirimanDriver />
            </ProtectedRoute>
          } />
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
