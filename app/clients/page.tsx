'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/store/authStore';
import { apiAuth } from '@/lib/api/client';
import { Client } from '@/lib/types';
import { CurrencyFormatter, getClientDisplayName } from '@/lib/utils/formatters';

export default function ClientsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');
  
  // Unique values for filters
  const [uniqueCities, setUniqueCities] = useState<string[]>([]);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clients, searchQuery, cityFilter, sortBy]);

  const fetchClients = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await apiAuth.post('/webhook/a307571b-e8c4-45d2-9244-b40305896648', {
        fi_owner: user.email,
      });

      if (response.data && Array.isArray(response.data)) {
        const clientsData = response.data[0]?.data || [];
        setClients(clientsData);
        
        // Extract unique cities
        const cities = Array.from(new Set(
          clientsData
            .map((c: Client) => c.CA_City)
            .filter((city: string | undefined): city is string => Boolean(city && city.trim()))
        )).sort();
        setUniqueCities(cities as string[]);
      }
    } catch (error: any) {
      console.error('Fetch clients error:', error);
      setError('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(client => {
        const name = getClientDisplayName(client).toLowerCase();
        const mobile = client.Mobile?.toLowerCase() || '';
        const userId = client.user_ID?.toLowerCase() || '';
        const fullName = client.Full_Name?.toLowerCase() || '';
        
        return name.includes(query) || 
               mobile.includes(query) || 
               userId.includes(query) ||
               fullName.includes(query);
      });
    }

    // City filter
    if (cityFilter !== 'All') {
      filtered = filtered.filter(client => client.CA_City === cityFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return getClientDisplayName(a).localeCompare(getClientDisplayName(b));
        case 'name-desc':
          return getClientDisplayName(b).localeCompare(getClientDisplayName(a));
        case 'os-high':
          return parseFloat(b.Total_OS_Yesterday1 || '0') - parseFloat(a.Total_OS_Yesterday1 || '0');
        case 'os-low':
          return parseFloat(a.Total_OS_Yesterday1 || '0') - parseFloat(b.Total_OS_Yesterday1 || '0');
        case 'dpd-high':
          return parseFloat(b.Days_Past_Due || '0') - parseFloat(a.Days_Past_Due || '0');
        case 'dpd-low':
          return parseFloat(a.Days_Past_Due || '0') - parseFloat(b.Days_Past_Due || '0');
        case 'buyback-asc':
          return (a.Buy_Back_Status || '').localeCompare(b.Buy_Back_Status || '');
        case 'buyback-desc':
          return (b.Buy_Back_Status || '').localeCompare(a.Buy_Back_Status || '');
        default:
          return 0;
      }
    });

    setFilteredClients(filtered);
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

  const handleOpenMaps = (address: string) => {
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCityFilter('All');
    setSortBy('name-asc');
  };

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
                  <h1 className="text-xl font-bold text-gray-900">Clients</h1>
                  <p className="text-sm text-gray-600">
                    {filteredClients.length} of {clients.length} clients
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/clients/all-locations')}
                className="btn-outline text-sm"
              >
                📍 View All Locations
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
              <button onClick={fetchClients} className="ml-4 underline">
                Retry
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search by name, phone, or ID..."
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
          </div>

          {/* Filters & Sort */}
          <div className="card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by City
                </label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="All">All Cities</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="os-high">Outstanding (High to Low)</option>
                  <option value="os-low">Outstanding (Low to High)</option>
                  <option value="dpd-high">DPD (High to Low)</option>
                  <option value="dpd-low">DPD (Low to High)</option>
                  {user?.team?.toLowerCase().includes('skorcard') && (
                    <>
                      <option value="buyback-asc">Buy Back Status (A-Z)</option>
                      <option value="buyback-desc">Buy Back Status (Z-A)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Reset Button */}
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="btn-outline w-full"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Clients List */}
              {filteredClients.length === 0 ? (
                <div className="card text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-600">No clients found</p>
                  <button onClick={resetFilters} className="btn-primary mt-4">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="card hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => router.push(`/clients/${client.id}`)}
                    >
                      {/* Client Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {getClientDisplayName(client)}
                          </h3>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <span>📱</span>
                              <span>{client.Mobile}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCallPhone(client.Mobile);
                                }}
                                className="ml-1 text-primary-600 hover:text-primary-700"
                              >
                                📞
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWhatsApp(client.Mobile);
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                💬
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyPhone(client.Mobile);
                                }}
                                className="text-gray-600 hover:text-gray-700"
                              >
                                📋
                              </button>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          client.Current_Status === 'Active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {client.Current_Status}
                        </span>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-2 mb-3 text-sm text-gray-600">
                        <span>📍</span>
                        <div className="flex-1">
                          <span>{client.CA_Line_1}</span>
                          {client.CA_Line_2 && <span>, {client.CA_Line_2}</span>}
                          <span>, {client.CA_City}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenMaps(`${client.CA_Line_1}, ${client.CA_City}`);
                            }}
                            className="ml-2 text-primary-600 hover:text-primary-700"
                          >
                            🗺️
                          </button>
                        </div>
                      </div>

                      {/* Financial Info */}
                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div>
                          <div className="text-gray-600">Outstanding</div>
                          <div className="font-semibold text-gray-900">
                            {CurrencyFormatter.format(client.Total_OS_Yesterday1)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">DPD</div>
                          <div className="font-semibold text-gray-900">
                            {client.Days_Past_Due} days | {client.DPD_Bucket}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-gray-200">
                        <Link
                          href={`/clients/${client.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 btn-primary text-center text-sm py-2"
                        >
                          View Details
                        </Link>
                        <Link
                          href={`/clients/${client.id}/contact`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 btn-outline text-center text-sm py-2"
                        >
                          Add Contactability
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
