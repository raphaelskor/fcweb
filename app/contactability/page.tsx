'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/store/authStore';
import { apiClient } from '@/lib/api/client';
import { DateTimeFormatter } from '@/lib/utils/formatters';

interface ContactabilityRecord {
  id: string;
  Channel: string;
  Contact_Result: string;
  Person_Contacted?: string;
  Visit_Notes?: string;
  Call_Notes?: string;
  Created_Time: string;
  Visit_Date?: string;
  User_ID?: {
    name: string;
    id: string;
  };
  Skor_User_ID?: string;
  Visit_Agent?: string;
  Call_Agent?: string;
  Vist_Action?: string;
  If_Connected?: string;
  Visit_Location?: string;
  Visit_Status?: string;
  Visit_Lat_Long?: string;
  Mobile?: string;
  Visit_Image_1?: string;
  Visit_Image_2?: string;
  Visit_Image_3?: string;
  Recording?: string;
}

export default function ContactabilityPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [records, setRecords] = useState<ContactabilityRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ContactabilityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchContactabilityHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, dateRange, channelFilter, resultFilter, searchQuery, sortBy]);

  const fetchContactabilityHistory = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/webhook/d540950f-85d2-4e2b-a054-7e5dfcef0379', {
        fi_owner: user.email,
      });

      if (response.data && Array.isArray(response.data)) {
        const historyData = response.data[0]?.data || [];
        setRecords(historyData);
      } else {
        console.log('Invalid response structure:', response.data);
        setError('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Fetch contactability history error:', error);
      setError('Failed to load contactability history');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

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

      filtered = filtered.filter(record => {
        const recordDate = new Date(record.Created_Time);
        return recordDate >= filterDate;
      });
    }

    // Channel filter
    if (channelFilter !== 'all') {
      filtered = filtered.filter(record => record.Channel === channelFilter);
    }

    // Result filter
    if (resultFilter !== 'all') {
      filtered = filtered.filter(record => record.Contact_Result === resultFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.User_ID?.name?.toLowerCase().includes(query) ||
        record.Skor_User_ID?.toLowerCase().includes(query) ||
        record.Contact_Result?.toLowerCase().includes(query) ||
        record.Visit_Notes?.toLowerCase().includes(query) ||
        record.Call_Notes?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.Created_Time).getTime();
      const dateB = new Date(b.Created_Time).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredRecords(filtered);
  };

  const getChannelIcon = (channel: string) => {
    if (channel === 'Field Visit') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    } else if (channel === 'Call') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      );
    }
  };

  const getChannelColor = (channel: string) => {
    if (channel === 'Field Visit') return 'bg-blue-100 text-blue-800';
    if (channel === 'Call') return 'bg-green-100 text-green-800';
    return 'bg-purple-100 text-purple-800';
  };

  const getResultColor = (result: string) => {
    if (result?.includes('PTP') || result?.includes('Paid') || result?.includes('Titip Surat')) {
      return 'bg-green-100 text-green-800';
    } else if (result?.includes('Refuse') || result?.includes('Not Found') || result?.includes('Tidak')) {
      return 'bg-red-100 text-red-800';
    } else if (result?.includes('Follow Up') || result?.includes('Negotiation')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const handleViewDetails = (record: ContactabilityRecord) => {
    if (record.User_ID?.id) {
      router.push(`/clients/${record.User_ID.id}`);
    }
  };

  const handleViewLocation = (latLong: string) => {
    const [lat, lng] = latLong.split(',');
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  // Calculate statistics
  const totalRecords = filteredRecords.length;
  const visitCount = filteredRecords.filter(r => r.Channel === 'Field Visit').length;
  const callCount = filteredRecords.filter(r => r.Channel === 'Call').length;
  const messageCount = filteredRecords.filter(r => r.Channel !== 'Field Visit' && r.Channel !== 'Call').length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
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
                  <h1 className="text-xl font-bold text-gray-900">Contactability History</h1>
                  <p className="text-sm text-gray-600">
                    {totalRecords} records
                  </p>
                </div>
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
              <button onClick={fetchContactabilityHistory} className="ml-4 underline">
                Retry
              </button>
            </div>
          )}

          {/* Statistics */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="card">
                <div className="text-sm text-gray-600 mb-1">Total Records</div>
                <div className="text-2xl font-bold text-gray-900">{totalRecords}</div>
              </div>
              <div className="card">
                <div className="text-sm text-gray-600 mb-1">Visits</div>
                <div className="text-2xl font-bold text-blue-600">{visitCount}</div>
              </div>
              <div className="card">
                <div className="text-sm text-gray-600 mb-1">Calls</div>
                <div className="text-2xl font-bold text-green-600">{callCount}</div>
              </div>
              <div className="card">
                <div className="text-sm text-gray-600 mb-1">Messages</div>
                <div className="text-2xl font-bold text-purple-600">{messageCount}</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Client, result, notes..."
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

              {/* Channel Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel
                </label>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Channels</option>
                  <option value="Field Visit">Field Visit</option>
                  <option value="Call">Call</option>
                  <option value="Message">Message</option>
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
                  <option value="Titip Surat">Titip Surat</option>
                  <option value="Promise to Pay (PTP)">Promise to Pay</option>
                  <option value="Already Paid">Already Paid</option>
                  <option value="Refuse to Pay">Refuse to Pay</option>
                  <option value="No Answer">No Answer</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => {
                  setDateRange('all');
                  setChannelFilter('all');
                  setResultFilter('all');
                  setSearchQuery('');
                  setSortBy('newest');
                }}
                className="btn-outline text-sm"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Records List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="card text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 mb-4">No records found</p>
              <button onClick={fetchContactabilityHistory} className="btn-primary">
                Refresh
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecords.map((record) => (
                <div 
                  key={record.id} 
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/contactability/${record.id}`)}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getChannelColor(record.Channel)}`}>
                      {getChannelIcon(record.Channel)}
                      {record.Channel}
                    </div>
                    <div className="text-xs text-gray-500">
                      {DateTimeFormatter.format(record.Created_Time, 'date')}
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="mb-3">
                    <div className="font-semibold text-gray-900">
                      {record.User_ID?.name || 'Unknown Client'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {record.Skor_User_ID || '-'}
                    </div>
                  </div>

                  {/* Result */}
                  <div className="mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getResultColor(record.Contact_Result)}`}>
                      {record.Contact_Result}
                    </span>
                  </div>

                  {/* Details */}
                  {record.Channel === 'Field Visit' && (
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      {record.If_Connected && (
                        <div>
                          <span className="font-medium">Action:</span> {record.If_Connected}
                        </div>
                      )}
                      {record.Person_Contacted && (
                        <div>
                          <span className="font-medium">Person:</span> {record.Person_Contacted}
                        </div>
                      )}
                      {record.Visit_Notes && (
                        <div>
                          <span className="font-medium">Notes:</span>{' '}
                          <div className="text-gray-700 mt-1 line-clamp-2">{record.Visit_Notes}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {record.Channel === 'Call' && record.Call_Notes && (
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="font-medium">Notes:</span>{' '}
                      <div className="text-gray-700 mt-1 line-clamp-2">{record.Call_Notes}</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={() => handleViewDetails(record)}
                      className="flex-1 btn-primary text-sm"
                    >
                      View Client
                    </button>
                    {record.Visit_Lat_Long && (
                      <button
                        onClick={() => handleViewLocation(record.Visit_Lat_Long!)}
                        className="btn-outline text-sm"
                      >
                        📍
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
