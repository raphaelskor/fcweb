'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/store/authStore';
import { apiAuth } from '@/lib/api/client';
import { DateTimeFormatter } from '@/lib/utils/formatters';

interface SkipTracingRecord {
  id: string;
  Source: string;
  Mobile: string;
  Mobile_Status: string | null;
  Provider: string | null;
  Created_Time: string;
  User_ID?: {
    name: string;
    id: string;
  };
}

export default function SkipTracingPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const user = useAuthStore((state) => state.user);

  const [records, setRecords] = useState<SkipTracingRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<SkipTracingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [clientName, setClientName] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchSkipTracing();
  }, [clientId]);

  useEffect(() => {
    applyFilters();
  }, [records, searchQuery, statusFilter, sortBy]);

  const fetchSkipTracing = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      console.log('Fetching skip tracing for client ID:', clientId);
      
      const response = await apiAuth.post('/webhook/fb6e465f-0e75-4b8c-8c51-f0831c4041f7', {
        id: clientId,
      });

      console.log('Skip tracing response:', response.data);

      if (response.data && Array.isArray(response.data)) {
        const data = response.data[0]?.data || [];
        console.log('Skip tracing data:', data);
        setRecords(data);
        
        // Get client name from first record
        if (data.length > 0 && data[0].User_ID) {
          setClientName(data[0].User_ID.name);
        }
      }
    } catch (error: any) {
      console.error('Fetch skip tracing error:', error);
      setError('Failed to load phone numbers');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.Mobile?.toLowerCase().includes(query) ||
        record.Source?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.Mobile_Status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.Created_Time).getTime() - new Date(a.Created_Time).getTime();
        case 'oldest':
          return new Date(a.Created_Time).getTime() - new Date(b.Created_Time).getTime();
        case 'sourceAsc':
          return (a.Source || '').localeCompare(b.Source || '');
        case 'sourceDesc':
          return (b.Source || '').localeCompare(a.Source || '');
        default:
          return 0;
      }
    });

    setFilteredRecords(filtered);
  };

  const handleCallPhone = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string) => {
    const cleanNumber = phone.replace(/[\s+]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    alert('Phone number copied!');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('newest');
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    if (status === 'Live') return 'bg-green-100 text-green-800';
    if (status === 'Dormant') return 'bg-yellow-100 text-yellow-800';
    if (status === 'Dead') return 'bg-red-100 text-red-800';
    if (status === 'Roaming') return 'bg-blue-100 text-blue-800';
    if (status === 'Data Usage Only') return 'bg-purple-100 text-purple-800';
    if (status === 'Not Valid') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const liveCount = filteredRecords.filter(r => r.Mobile_Status === 'Live').length;
  const dormantCount = filteredRecords.filter(r => r.Mobile_Status === 'Dormant').length;
  const deadCount = filteredRecords.filter(r => r.Mobile_Status === 'Dead').length;

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
                  <h1 className="text-xl font-bold text-gray-900">Skip Tracing</h1>
                  <p className="text-sm text-gray-600">
                    {clientName && `${clientName} - `}
                    {filteredRecords.length} phone numbers
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
              <button onClick={fetchSkipTracing} className="ml-4 underline">
                Retry
              </button>
            </div>
          )}

          {/* Statistics */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{filteredRecords.length}</div>
                <div className="text-xs text-gray-600">Total Numbers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{liveCount}</div>
                <div className="text-xs text-gray-600">Live</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{dormantCount}</div>
                <div className="text-xs text-gray-600">Dormant</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{deadCount}</div>
                <div className="text-xs text-gray-600">Dead</div>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="card mb-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search by phone number or source..."
                  className="input-field pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field">
                    <option value="all">All Status</option>
                    <option value="Live">Live</option>
                    <option value="Dormant">Dormant</option>
                    <option value="Dead">Dead</option>
                    <option value="Roaming">Roaming</option>
                    <option value="Data Usage Only">Data Usage Only</option>
                    <option value="Not Valid">Not Valid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="sourceAsc">Source (A-Z)</option>
                    <option value="sourceDesc">Source (Z-A)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button onClick={resetFilters} className="btn-outline w-full">
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Phone Numbers List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="card text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <p className="text-gray-600 mb-4">No phone numbers found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record, index) => (
                <div key={record.id || index} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-xl font-bold text-gray-900">{record.Mobile}</div>
                        {record.Mobile_Status && (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.Mobile_Status)}`}>
                            {record.Mobile_Status}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Provider:</span>
                          <span className="text-gray-900">{record.Provider || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Source:</span>
                          <span className="text-gray-900">{record.Source || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Status:</span>
                          <span className="text-gray-900">{record.Mobile_Status || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Added:</span>
                          <span className="text-gray-600">
                            {DateTimeFormatter.format(record.Created_Time, 'full')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleCallPhone(record.Mobile)}
                        className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100"
                        title="Call"
                      >
                        📞
                      </button>
                      <button
                        onClick={() => handleWhatsApp(record.Mobile)}
                        className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                        title="WhatsApp"
                      >
                        💬
                      </button>
                      <button
                        onClick={() => handleCopyPhone(record.Mobile)}
                        className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"
                        title="Copy"
                      >
                        📋
                      </button>
                    </div>
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
