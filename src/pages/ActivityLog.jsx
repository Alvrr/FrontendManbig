// pages/ActivityLog.jsx
import React, { useState, useEffect } from 'react';
import { 
  getActivityIcon, 
  getActivityColor, 
  formatActivityTime
} from '../utils/activityUtils';
import { useActivityLog } from '../hooks/useActivityLog';
import PageWrapper from '../components/PageWrapper';
import Card from '../components/Card';
import { showErrorAlert, showTimedSuccessAlert } from '../utils/alertUtils';
import { 
  ClockIcon, 
  FunnelIcon, 
  ArrowPathIcon,
  ChartBarIcon,
  CalendarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const ActivityLog = () => {
  // Filter states
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Use the activity log hook
  const {
    activities,
    loading,
    error,
    lastUpdated,
    refresh,
    getStats
  } = useActivityLog({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    maxActivities: 1000
  });

  useEffect(() => {
    // User role check completed in parent component
  }, []);

  // Filter activities
  const filteredActivities = React.useMemo(() => {
    let filtered = [...activities];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterType);
    }

    // Filter by date
    if (filterDate) {
      const selectedDate = new Date(filterDate);
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate.toDateString() === selectedDate.toDateString();
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(term) ||
        activity.description.toLowerCase().includes(term) ||
        activity.user.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [activities, filterType, filterDate, searchTerm]);

  const stats = getStats();

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activityTypes = [
    { value: 'all', label: 'Semua Aktivitas', count: activities.length },
    { value: 'transaction', label: 'Transaksi', count: activities.filter(a => a.type === 'transaction').length },
    { value: 'product', label: 'Produk', count: activities.filter(a => a.type === 'product').length },
    { value: 'customer', label: 'Pelanggan', count: activities.filter(a => a.type === 'customer').length },
    { value: 'system', label: 'Sistem', count: activities.filter(a => a.type === 'system').length }
  ];

  const refreshActivities = async () => {
    try {
      await refresh();
      showTimedSuccessAlert(
        'Berhasil',
        'Aktivitas telah diperbarui',
        1500
      );
    } catch {
      showErrorAlert(
        'Error',
        'Gagal memperbarui aktivitas'
      );
    }
  };

  return (
    <PageWrapper 
      title="Log Aktivitas Sistem" 
      description="Monitor semua aktivitas dan perubahan yang terjadi di sistem"
      action={
        <button
          onClick={refreshActivities}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-white/40 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      }
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-white/10">
              <ClockIcon className="w-6 h-6 text-sky-300" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white/70">Total Aktivitas</p>
              <p className="text-2xl font-semibold text-white">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-white/10">
              <CalendarIcon className="w-6 h-6 text-emerald-300" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white/70">Hari Ini</p>
              <p className="text-2xl font-semibold text-white">{stats.today}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-white/10">
              <ChartBarIcon className="w-6 h-6 text-sky-300" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white/70">Minggu Ini</p>
              <p className="text-2xl font-semibold text-white">{stats.thisWeek}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-white/10">
              <ChartBarIcon className="w-6 h-6 text-amber-300" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white/70">Filtered</p>
              <p className="text-2xl font-semibold text-white">{filteredActivities.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card className="mb-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-white/60" />
            <h3 className="text-lg font-semibold text-white">Filter Aktivitas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Activity Type Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Jenis Aktivitas</label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-glass w-full px-3 py-2"
              >
                {activityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} ({type.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Tanggal</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input-glass w-full px-3 py-2"
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Pencarian</label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-white/60 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari aktivitas..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input-glass w-full pl-10 pr-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Reset Filter</label>
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterDate('');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="w-full btn-secondary-glass px-4 py-2 rounded-lg transition-colors"
              >
                Reset Filter
              </button>
            </div>
          </div>

          {/* Last Updated Info */}
          {lastUpdated && (
            <div className="mt-4 text-sm text-white/60">
              Terakhir diperbarui: {formatActivityTime(lastUpdated.toISOString())}
            </div>
          )}
        </div>
      </Card>

      {/* Activity List */}
      <Card>
        {loading && activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-white/70">Memuat aktivitas...</p>
          </div>
        ) : error && activities.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Gagal Memuat Aktivitas</h3>
            <p className="text-white/70 mb-4">{error}</p>
            <button
              onClick={refreshActivities}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="w-12 h-12 text-white/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Tidak Ada Aktivitas</h3>
            <p className="text-white/70">Tidak ada aktivitas yang sesuai dengan filter yang dipilih.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-white">
                        {activity.title}
                      </h4>
                      <span className="text-sm text-white/60">
                        {formatActivityTime(activity.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-white/70 mt-1">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-white/60">
                        oleh <span className="font-medium">{activity.user}</span>
                      </span>
                      
                      {activity.details && activity.details.amount && (
                        <span className={`badge ${activity.type === 'transaction' ? 'badge-selesai' : 'badge-dikirim'}`}>
                          {new Intl.NumberFormat('id-ID', { 
                            style: 'currency', 
                            currency: 'IDR' 
                          }).format(activity.details.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="btn-secondary-glass px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      currentPage === i + 1
                        ? "bg-sky-600 text-white"
                        : "btn-secondary-glass"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className="btn-secondary-glass px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </PageWrapper>
  );
};

export default ActivityLog;
