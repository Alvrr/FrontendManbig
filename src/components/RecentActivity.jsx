// components/RecentActivity.jsx
import React, { useState } from 'react';
import { 
  getActivityIcon, 
  getActivityColor, 
  formatActivityTime
} from '../utils/activityUtils';
import { useActivityLog } from '../hooks/useActivityLog';
import { ClockIcon, EyeIcon, ChevronRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const RecentActivity = ({ maxItems = 5, showStats = true, className = "" }) => {
  const [showAll, setShowAll] = useState(false);
  
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
    maxActivities: 50
  });

  const displayedActivities = showAll ? activities : activities.slice(0, maxItems);
  const stats = getStats();

  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (err) {
      console.error('Failed to refresh activities:', err);
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-red-500">
          <ClockIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h3>
            {loading && (
              <ArrowPathIcon className="w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <EyeIcon className="w-4 h-4" />
            <span>{showAll ? 'Lihat Ringkas' : 'Lihat Semua'}</span>
          </button>
        </div>
        
        {/* Stats */}
        {showStats && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Total Aktivitas</div>
              <div className="text-xl font-semibold text-blue-600">{stats.total}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Hari Ini</div>
              <div className="text-xl font-semibold text-green-600">{stats.today}</div>
            </div>
          </div>
        )}

        {/* Last Updated Info */}
        {lastUpdated && (
          <div className="mt-2 text-xs text-gray-500">
            Terakhir diperbarui: {formatActivityTime(lastUpdated.toISOString())}
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada aktivitas terbaru</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </h4>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      oleh {activity.user}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatActivityTime(activity.timestamp)}
                    </span>
                  </div>
                  
                  {/* Additional Details */}
                  {activity.details && activity.details.amount && (
                    <div className="mt-2 text-xs">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                        activity.type === 'transaction' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {new Intl.NumberFormat('id-ID', { 
                          style: 'currency', 
                          currency: 'IDR' 
                        }).format(activity.details.amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Show More Button */}
        {!showAll && activities.length > maxItems && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Lihat {activities.length - maxItems} aktivitas lainnya
            </button>
          </div>
        )}
      </div>
      
      {/* Refresh Button */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="w-full text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Memperbarui...' : 'Perbarui Aktivitas'}</span>
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;
