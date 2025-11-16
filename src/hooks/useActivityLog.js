import { useState, useEffect, useCallback } from 'react';

// Mock data yang realistis - di luar component agar tidak menyebabkan re-render
const mockActivities = [
  {
    id: 1,
    type: 'transaction',
    title: 'Transaksi Selesai',
    description: 'Transaksi pembayaran untuk Roti Bakar berhasil diselesaikan',
    user: 'Kasir Ahmad',
    timestamp: new Date().toISOString(),
    details: { amount: 15000 }
  },
  {
    id: 2,
    type: 'payment',
    title: 'Pembayaran Baru',
    description: 'Pembayaran baru untuk pelanggan Siti Aminah',
    user: 'Kasir Budi',
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 menit lalu
    details: { amount: 25000 }
  },
  {
    id: 3,
    type: 'product',
    title: 'Stok Produk Diperbarui',
    description: 'Stok Nasi Goreng telah diperbarui menjadi 50 unit',
    user: 'Admin',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 jam lalu
    details: { stock: 50 }
  },
  {
    id: 4,
    type: 'customer',
    title: 'Pelanggan Baru Terdaftar',
    description: 'Pelanggan baru: John Doe telah mendaftar ke sistem',
    user: 'Kasir Ahmad',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 jam lalu
    details: {}
  },
  {
    id: 5,
    type: 'employee',
    title: 'Karyawan Login',
    description: 'Driver Andi telah login ke sistem',
    user: 'System',
    timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 jam lalu
    details: {}
  }
];

export const useActivityLog = (options = {}) => {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    maxActivities = 50
  } = options;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulasi delay API yang lebih cepat
      await new Promise(resolve => setTimeout(resolve, 500));

      // Set mock data dengan limit sesuai maxActivities
      const limitedActivities = mockActivities.slice(0, maxActivities);
      setActivities(limitedActivities);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Gagal memuat aktivitas');
    } finally {
      setLoading(false);
    }
  }, [maxActivities]);

  const refresh = useCallback(async () => {
    await fetchActivities();
  }, [fetchActivities]);

  const getStats = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActivities = activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      activityDate.setHours(0, 0, 0, 0);
      return activityDate.getTime() === today.getTime();
    });

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const weekActivities = activities.filter(activity => 
      new Date(activity.timestamp) >= thisWeek
    );

    return {
      total: activities.length,
      today: todayActivities.length,
      thisWeek: weekActivities.length
    };
  }, [activities]);

  // Initial fetch
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Auto refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchActivities, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchActivities]);

  return {
    activities,
    loading,
    error,
    lastUpdated,
    refresh,
    getStats
  };
};