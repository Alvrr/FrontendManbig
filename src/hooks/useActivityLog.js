import { useState, useEffect, useCallback } from 'react';
import { getAllPembayaran } from '../services/pembayaranAPI';
import { listTransaksi } from '../services/transaksiAPI';
import { listPengiriman } from '../services/pengirimanAPI';
import { getAllPelanggan } from '../services/pelangganAPI';
import { getAllKaryawan } from '../services/karyawanAPI';

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
      const [pembayaran, transaksi, pengiriman, pelanggan, karyawan] = await Promise.all([
        getAllPembayaran().catch(() => []),
        listTransaksi().catch(() => []),
        listPengiriman().catch(() => []),
        getAllPelanggan().catch(() => []),
        getAllKaryawan().catch(() => [])
      ]);

      const pelangganMap = new Map((Array.isArray(pelanggan) ? pelanggan : []).map(p => [p.id, p.nama]));
      const karyawanMap = new Map((Array.isArray(karyawan) ? karyawan : (karyawan?.data || [])).map(u => [u.id, u.nama]));
      const shipByTrx = new Map();
      (Array.isArray(pengiriman) ? pengiriman : []).forEach(s => {
        if (!shipByTrx.has(s.transaksi_id)) shipByTrx.set(s.transaksi_id, s);
      });

      // Selaraskan dengan laporan: kecualikan ID tertentu (PMB005..PMB001)
      const excludeIds = new Set(['PMB005','PMB004','PMB003','PMB002','PMB001']);

      const activitiesFromPayments = (Array.isArray(pembayaran) ? pembayaran : [])
        .filter(p => !excludeIds.has(String(p?.id)))
        .map(p => {
          const trx = (Array.isArray(transaksi) ? transaksi : []).find(t => t.id === p.transaksi_id) || {};
          const ship = shipByTrx.get(p.transaksi_id) || {};
          const pelangganNama = pelangganMap.get(trx.pelanggan_id) || 'Pelanggan';
          const kasirNama = karyawanMap.get(trx.kasir_id) || 'Kasir';
          const isSelesai = String(p.status || '').toLowerCase() === 'selesai';
          const tipe = isSelesai ? 'transaction' : 'payment';
          const title = isSelesai ? 'Transaksi Selesai' : 'Pembayaran Baru';
          const amount = Math.max(0, Number(p.total_bayar || 0) - Number(ship.ongkir || 0));
          const description = isSelesai
            ? `Transaksi untuk ${pelangganNama} berhasil diselesaikan`
            : `Pembayaran untuk pelanggan ${pelangganNama}`;
          return {
            id: p.id,
            type: tipe,
            title,
            description,
            user: kasirNama,
            timestamp: p.tanggal || p.created_at || new Date().toISOString(),
            details: { amount }
          };
        });

      // Sort by timestamp desc and limit
      const normalized = activitiesFromPayments
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, maxActivities);

      setActivities(normalized);
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