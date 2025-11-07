'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/store/authStore';
import { apiClient } from '@/lib/api/client';
import { Contactability } from '@/lib/types';
import { DateTimeFormatter } from '@/lib/utils/formatters';

// Dynamic import for Map component to avoid SSR issues
const MapView = dynamic(() => import('@/components/LocationMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-600">Loading map...</div>
    </div>
  )
});

export default function LocationHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const user = useAuthStore((state) => state.user);

  const [visits, setVisits] = useState<Contactability[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Contactability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchLocationHistory();
  }, [clientId]);

  useEffect(() => {
    applyFilters();
  }, [visits, dateRange, resultFilter, actionFilter, sortBy]);

  const fetchLocationHistory = async () => {
    setIsLoading(true);
    setError('');

    try {
      // API #3: Get contactability history for ONE specific client
      const response = await apiClient.post('/webhook/0843b27d-6ead-4232-9499-adb2e09cc02e', {
        id: clientId,
      });

      if (response.data && Array.isArray(response.data)) {
        const historyData = response.data[0]?.data || [];
        // Filter only Visit channel
        const visitData = historyData.filter((h: Contactability) => h.Channel === 'Visit');
        setVisits(visitData);
      }
    } catch (error: any) {
      console.error('Fetch location history error:', error);
      setError('Failed to load location history');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...visits];

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'last7days':
          filterDate.setDate(filterDate.getDate() - 7);
          break;
        case 'last30days':
          filterDate.setDate(filterDate.getDate() - 30);
          break;
        case 'thisMonth':
          filterDate.setDate(1);
          filterDate.setHours(0, 0, 0, 0);
          break;
      }

      filtered = filtered.filter(visit => {
        const visitDate = new Date(visit.Contact_Date);
        return visitDate >= filterDate;
      });
    }

    // Result filter
    if (resultFilter !== 'all') {
      filtered = filtered.filter(visit => visit.Contact_Result === resultFilter);
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(visit => visit.Visit_Action === actionFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.Contact_Date).getTime();
      const dateB = new Date(b.Contact_Date).getTime();
      
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredVisits(filtered);
  };

  const handleOpenMaps = (lat: string, lng: string) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const getResultColor = (result: string) => {
    if (result.includes('PTP') || result.includes('Paid') || result.includes('Hot Prospect')) {
      return 'bg-green-100 text-green-800';
    } else if (result.includes('Refuse') || result.includes('Not Found') || result.includes('Salah')) {
      return 'bg-red-100 text-red-800';
    } else if (result.includes('Follow Up') || result.includes('Negotiation')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getActionColor = (action?: string) => {
    if (action === 'RPC') return 'bg-blue-100 text-blue-800';
    if (action === 'TPC') return 'bg-purple-100 text-purple-800';
    if (action === 'OPC') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const resetFilters = () => {
    setDateRange('all');
    setResultFilter('all');
    setActionFilter('all');
    setSortBy('newest');
  };

  // Calculate statistics
  const totalVisits = filteredVisits.length;
  const rpcCount = filteredVisits.filter(v => v.Visit_Action === 'RPC').length;
  const tpcCount = filteredVisits.filter(v => v.Visit_Action === 'TPC').length;
  const opcCount = filteredVisits.filter(v => v.Visit_Action === 'OPC').length;
  const ptpCount = filteredVisits.filter(v => v.Contact_Result.includes('PTP')).length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Location History</h1>
                <p className="text-sm text-gray-600">{totalVisits} visits found</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
              <button onClick={fetchLocationHistory} className="ml-4 underline">
                Retry
              </button>
            </div>
          )}

          {/* Statistics Card */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalVisits}</div>
                <div className="text-xs text-gray-600">Total Visits</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{rpcCount}</div>
                <div className="text-xs text-gray-600">RPC</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{tpcCount}</div>
                <div className="text-xs text-gray-600">TPC</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">{opcCount}</div>
                <div className="text-xs text-gray-600">OPC</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{ptpCount}</div>
                <div className="text-xs text-gray-600">PTP</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="input-field">
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="thisMonth">This Month</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visit Action</label>
                <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="input-field">
                  <option value="all">All Actions</option>
                  <option value="RPC">RPC</option>
                  <option value="TPC">TPC</option>
                  <option value="OPC">OPC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              <div className="flex items-end">
                <button onClick={resetFilters} className="btn-outline w-full">
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Map View with OpenStreetMap */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Map View</h2>
            {filteredVisits.length > 0 && filteredVisits.some(v => v.latitude && v.longitude) ? (
              <div className="h-96 rounded-lg overflow-hidden">
                <MapView visits={filteredVisits} />
              </div>
            ) : (
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="text-gray-600">No location data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Timeline List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredVisits.length === 0 ? (
              <div className="card text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-gray-600">No visit history found</p>
              </div>
            ) : (
              filteredVisits.map((visit) => (
                <div key={visit.id} className="card hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(visit.Visit_Action)}`}>
                        {visit.Visit_Action}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getResultColor(visit.Contact_Result)}`}>
                        {visit.Contact_Result}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {DateTimeFormatter.format(visit.Contact_Date, 'full')}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm mb-3">
                    {visit.Visit_Location && (
                      <div>
                        <span className="text-gray-600">Location: </span>
                        <span className="font-medium text-gray-900">{visit.Visit_Location}</span>
                      </div>
                    )}
                    {visit.Visit_Status && (
                      <div>
                        <span className="text-gray-600">Status: </span>
                        <span className="font-medium text-gray-900">{visit.Visit_Status}</span>
                      </div>
                    )}
                    {visit.Person_Contacted && (
                      <div>
                        <span className="text-gray-600">Person: </span>
                        <span className="font-medium text-gray-900">{visit.Person_Contacted}</span>
                      </div>
                    )}
                    {visit.Visit_Notes && (
                      <div>
                        <span className="text-gray-600">Notes: </span>
                        <span className="text-gray-900">{visit.Visit_Notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Coordinates & Actions */}
                  {visit.latitude && visit.longitude && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        📍 {visit.latitude}, {visit.longitude}
                      </div>
                      <button
                        onClick={() => handleOpenMaps(visit.latitude, visit.longitude)}
                        className="btn-outline text-sm py-1 px-3"
                      >
                        Open in Maps
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
