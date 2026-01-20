// components/RecentActivity.jsx
import React, { useState } from 'react';
import { 
  getActivityIcon, 
  getActivityColor, 
  formatActivityTime
} from '../utils/activityUtils';
import { useActivityLog } from '../hooks/useActivityLog';
import { ClockIcon, EyeIcon, ChevronRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const RecentActivity = ({ maxItems = 5, showStats = true, hideControls = false, privacyMode = 'default', className = "" }) => {
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
    maxActivities: 50,
    privacyMode
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
      <div className={`card-glass p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/10 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-white/10 rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-white/10 rounded w-1/2"></div>
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
      <div className={`card-glass p-6 ${className}`}>
        <div className="text-center text-red-300">
          <ClockIcon className="w-12 h-12 mx-auto mb-2 text-white/60" />
          <p className="text-white">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 text-sm text-white/80 hover:text-white"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-glass ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-5 h-5 text-white/70" />
            <h3 className="text-lg font-semibold text-white">Aktivitas Terbaru</h3>
            {loading && (
              <ArrowPathIcon className="w-4 h-4 text-white/60 animate-spin" />
            )}
          </div>
          {!hideControls && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-white/80 hover:text-white flex items-center space-x-1"
            >
              <EyeIcon className="w-4 h-4" />
              <span>{showAll ? 'Lihat Ringkas' : 'Lihat Semua'}</span>
            </button>
          )}
        </div>
        
        {/* Stats */}
        {showStats && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-3 rounded-lg">
              <div className="text-sm text-white/80">Total Aktivitas</div>
              <div className="text-xl font-semibold text-white">{stats.total}</div>
            </div>
            <div className="bg-white/10 p-3 rounded-lg">
              <div className="text-sm text-white/80">Hari Ini</div>
              <div className="text-xl font-semibold text-white">{stats.today}</div>
            </div>
          </div>
        )}

        {/* Last Updated Info */}
        {lastUpdated && (
          <div className="mt-2 text-xs text-white/70">
            Terakhir diperbarui: {formatActivityTime(lastUpdated.toISOString())}
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-white/60 mx-auto mb-3" />
            <p className="text-white/70">Belum ada aktivitas terbaru</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 group hover:bg-white/10 p-2 rounded-lg transition-colors">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white truncate">
                      {activity.title}
                    </h4>
                    <ChevronRightIcon className="w-4 h-4 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <p className="text-sm text-white/80 mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-white/70">
                      oleh {activity.user}
                    </span>
                    <span className="text-xs text-white/60">
                      {formatActivityTime(activity.timestamp)}
                    </span>
                  </div>
                  
                  {/* Additional Details */}
                  {privacyMode !== 'admin' && (activity.details && (activity.details.amount || activity.details.ongkir)) && (
                    <div className="mt-2 text-xs flex items-center gap-2">
                      {activity.details.amount ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                          activity.type === 'transaction' ? 'bg-green-500/20 text-green-200' : 'bg-blue-500/20 text-blue-200'
                        }`}>
                          {new Intl.NumberFormat('id-ID', { 
                            style: 'currency', 
                            currency: 'IDR' 
                          }).format(activity.details.amount)}
                        </span>
                      ) : null}
                      {activity.details.ongkir ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full font-medium bg-sky-500/20 text-sky-200">
                          Ongkir: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(activity.details.ongkir)}
                        </span>
                      ) : null}
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
              className="text-sm text-white/80 hover:text-white font-medium"
            >
              Lihat {activities.length - maxItems} aktivitas lainnya
            </button>
          </div>
        )}
      </div>
      
      {/* Refresh Button */}
      {!hideControls && (
        <div className="px-6 py-3 bg-white/5 border-t border-white/10">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="w-full text-sm text-white/80 hover:text-white disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Memperbarui...' : 'Perbarui Aktivitas'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
