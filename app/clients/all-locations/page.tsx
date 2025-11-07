'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/store/authStore';
import { apiClient } from '@/lib/api/client';
import { Contactability } from '@/lib/types';
import { DateTimeFormatter } from '@/lib/utils/formatters';

// Dynamic import for Map component
const AllLocationsMap = dynamic(() => import('@/components/AllLocationsMap'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  )
});

export default function AllLocationsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [visits, setVisits] = useState<Contactability[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Contactability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<Contactability | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [clientSearch, setClientSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('all');

  useEffect(() => {
    fetchAllLocations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [visits, dateRange, clientSearch, resultFilter]);

  const fetchAllLocations = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/webhook/d540950f-85d2-4e2b-a054-7e5dfcef0379', {
        fi_owner: user.email,
      });

      if (response.data && Array.isArray(response.data)) {
        const historyData = response.data[0]?.data || [];
        // Filter only Visit channel with valid coordinates
        const visitData = historyData.filter(
          (h: Contactability) => h.Channel === 'Visit' && h.latitude && h.longitude
        );
        setVisits(visitData);
      }
    } catch (error: any) {
      console.error('Fetch all locations error:', error);
      setError('Failed to load locations');
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

    // Client search filter
    if (clientSearch) {
      const query = clientSearch.toLowerCase();
      filtered = filtered.filter(visit =>
        visit.client_name?.toLowerCase().includes(query)
      );
    }

    // Result filter
    if (resultFilter !== 'all') {
      filtered = filtered.filter(visit => visit.Contact_Result === resultFilter);
    }

    setFilteredVisits(filtered);
  };

  const handleVisitClick = (visit: Contactability) => {
    setSelectedVisit(visit);
    setSidebarOpen(true);
  };

  const handleViewClient = (clientId: string) => {
    router.push(`/clients/${clientId}`);
  };

  // Calculate statistics
  const totalVisits = filteredVisits.length;
  const uniqueClients = new Set(filteredVisits.map(v => v.client_id)).size;
  const cities = new Set(
    filteredVisits.map(v => v.Action_Location).filter(Boolean)
  );
  const mostVisitedCity = Array.from(cities).reduce((acc, city) => {
    const count = filteredVisits.filter(v => v.Action_Location === city).length;
    return count > acc.count ? { city, count } : acc;
  }, { city: '-', count: 0 });

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm z-20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
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
                  <h1 className="text-xl font-bold text-gray-900">All Locations</h1>
                  <p className="text-sm text-gray-600">
                    {totalVisits} visits • {uniqueClients} clients
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="btn-outline text-sm"
              >
                {sidebarOpen ? 'Hide' : 'Show'} Filters
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative">
            {error ? (
              <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button onClick={fetchAllLocations} className="btn-primary">
                    Retry
                  </button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
                  <p className="text-gray-600">Loading locations...</p>
                </div>
              </div>
            ) : (
              <AllLocationsMap
                visits={filteredVisits}
                selectedVisit={selectedVisit}
                onVisitClick={handleVisitClick}
              />
            )}
          </div>

          {/* Sidebar */}
          {sidebarOpen && (
            <div className="w-96 bg-white shadow-lg overflow-y-auto">
              <div className="p-4">
                {/* Statistics */}
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Statistics</h2>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{totalVisits}</div>
                      <div className="text-xs text-gray-600">Total Visits</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{uniqueClients}</div>
                      <div className="text-xs text-gray-600">Unique Clients</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg col-span-2">
                      <div className="text-lg font-bold text-purple-600">{mostVisitedCity.city}</div>
                      <div className="text-xs text-gray-600">Most Visited ({mostVisitedCity.count} visits)</div>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Filters</h2>
                  <div className="space-y-3">
                    {/* Client Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search Client
                      </label>
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Client name..."
                        className="input-field"
                      />
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Range
                      </label>
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="input-field"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="last7days">Last 7 Days</option>
                        <option value="last30days">Last 30 Days</option>
                        <option value="thisMonth">This Month</option>
                      </select>
                    </div>

                    {/* Result Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Result
                      </label>
                      <select
                        value={resultFilter}
                        onChange={(e) => setResultFilter(e.target.value)}
                        className="input-field"
                      >
                        <option value="all">All Results</option>
                        <option value="Promise to Pay (PTP)">Promise to Pay</option>
                        <option value="Already Paid">Already Paid</option>
                        <option value="Hot Prospect">Hot Prospect</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Refuse to Pay">Refuse to Pay</option>
                        <option value="Follow Up">Follow Up</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        setDateRange('all');
                        setClientSearch('');
                        setResultFilter('all');
                      }}
                      className="btn-outline w-full"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>

                {/* Selected Visit Details */}
                {selectedVisit && (
                  <div className="border-t pt-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Visit Details</h2>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Client:</span>{' '}
                        <button
                          onClick={() => handleViewClient(selectedVisit.client_id)}
                          className="text-primary-600 hover:underline"
                        >
                          {selectedVisit.client_name}
                        </button>
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{' '}
                        {DateTimeFormatter.format(selectedVisit.Contact_Date, 'full')}
                      </div>
                      <div>
                        <span className="font-medium">Action:</span> {selectedVisit.Visit_Action}
                      </div>
                      <div>
                        <span className="font-medium">Result:</span> {selectedVisit.Contact_Result}
                      </div>
                      {selectedVisit.Visit_Location && (
                        <div>
                          <span className="font-medium">Location:</span> {selectedVisit.Visit_Location}
                        </div>
                      )}
                      {selectedVisit.Person_Contacted && (
                        <div>
                          <span className="font-medium">Person:</span> {selectedVisit.Person_Contacted}
                        </div>
                      )}
                      {selectedVisit.Visit_Notes && (
                        <div>
                          <span className="font-medium">Notes:</span>{' '}
                          <div className="mt-1 text-gray-700">{selectedVisit.Visit_Notes}</div>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <span className="font-medium">Coordinates:</span>{' '}
                        {selectedVisit.latitude}, {selectedVisit.longitude}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleViewClient(selectedVisit.client_id)}
                          className="flex-1 btn-primary text-sm"
                        >
                          View Client
                        </button>
                        <button
                          onClick={() => {
                            const url = `https://www.google.com/maps?q=${selectedVisit.latitude},${selectedVisit.longitude}`;
                            window.open(url, '_blank');
                          }}
                          className="flex-1 btn-outline text-sm"
                        >
                          Open Maps
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visit List */}
                <div className="border-t pt-4 mt-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Recent Visits ({filteredVisits.length})
                  </h2>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredVisits.slice(0, 20).map((visit) => (
                      <button
                        key={visit.id}
                        onClick={() => handleVisitClick(visit)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedVisit?.id === visit.id
                            ? 'bg-primary-50 border border-primary-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium text-sm text-gray-900">
                          {visit.client_name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {DateTimeFormatter.format(visit.Contact_Date, 'date')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {visit.Contact_Result}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
