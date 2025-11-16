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
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
            <div className="p-3 rounded-lg bg-blue-100">
              <ClockIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Aktivitas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CalendarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Hari Ini</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.today}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Minggu Ini</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.thisWeek}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <ChartBarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Filtered</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredActivities.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card className="mb-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Filter Aktivitas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Activity Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Aktivitas</label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pencarian</label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari aktivitas..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reset Filter</label>
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterDate('');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Reset Filter
              </button>
            </div>
          </div>

          {/* Last Updated Info */}
          {lastUpdated && (
            <div className="mt-4 text-sm text-gray-500">
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
            <p className="text-gray-500">Memuat aktivitas...</p>
          </div>
        ) : error && activities.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Gagal Memuat Aktivitas</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refreshActivities}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Aktivitas</h3>
            <p className="text-gray-500">Tidak ada aktivitas yang sesuai dengan filter yang dipilih.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900">
                        {activity.title}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {formatActivityTime(activity.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-gray-500">
                        oleh <span className="font-medium">{activity.user}</span>
                      </span>
                      
                      {activity.details && activity.details.amount && (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          activity.type === 'transaction' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
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
              <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
