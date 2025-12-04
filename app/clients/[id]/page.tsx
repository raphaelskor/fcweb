'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/store/authStore';
import { apiAuth, apiClient } from '@/lib/api/client';
import { Client, Contactability } from '@/lib/types';
import { CurrencyFormatter, DateTimeFormatter, getClientDisplayName } from '@/lib/utils/formatters';

// Dynamic import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function ClientDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const user = useAuthStore((state) => state.user);

  const [client, setClient] = useState<Client | null>(null);
  const [contactHistory, setContactHistory] = useState<Contactability[]>([]);
  const [filteredContactHistory, setFilteredContactHistory] = useState<Contactability[]>([]);
  const [isLoadingClient, setIsLoadingClient] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [emiRestructuring, setEmiRestructuring] = useState<any>(null);
  const [isLoadingEMI, setIsLoadingEMI] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // Filters for contact history
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');

  useEffect(() => {
    fetchClientDetails();
    fetchContactHistory();
    // Fetch EMI Restructuring only for Skorcard team
    if (user?.team?.toLowerCase().includes('skorcard')) {
      fetchEMIRestructuring();
    }
  }, [clientId, user?.team]);

  useEffect(() => {
    applyContactHistoryFilters();
  }, [contactHistory, dateRangeFilter, resultFilter]);

  const fetchClientDetails = async () => {
    if (!user?.email) return;

    setIsLoadingClient(true);
    setError('');

    try {
      const response = await apiAuth.post('/webhook/a307571b-e8c4-45d2-9244-b40305896648', {
        fi_owner: user.email,
      });

      if (response.data && Array.isArray(response.data)) {
        const clientsData = response.data[0]?.data || [];
        const foundClient = clientsData.find((c: Client) => c.id === clientId);
        
        if (foundClient) {
          setClient(foundClient);
        } else {
          setError('Client not found');
        }
      }
    } catch (error: any) {
      console.error('Fetch client error:', error);
      setError('Failed to load client details');
    } finally {
      setIsLoadingClient(false);
    }
  };

  const fetchContactHistory = async () => {
    if (!user?.email) return;

    setIsLoadingHistory(true);

    try {
      const response = await apiAuth.post('/webhook/0843b27d-6ead-4232-9499-adb2e09cc02e', {
        id: clientId,
        team: user?.team || '',
        email: user?.email || '',
      });

      if (response.data && Array.isArray(response.data)) {
        const historyData = response.data[0]?.data || [];
        setContactHistory(historyData);
        setFilteredContactHistory(historyData);
      }
    } catch (error: any) {
      console.error('Fetch history error:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchEMIRestructuring = async () => {
    setIsLoadingEMI(true);

    try {
      const response = await apiAuth.post('/webhook/6894fe90-b82f-48b8-bb16-8397a3b54c32', {
        id: clientId,
      });

      if (response.data && Array.isArray(response.data)) {
        const emiData = response.data[0]?.data || [];
        if (emiData.length > 0) {
          setEmiRestructuring(emiData[0]);
        }
      }
    } catch (error: any) {
      console.error('Fetch EMI restructuring error:', error);
      // Don't show error, just hide the section
    } finally {
      setIsLoadingEMI(false);
    }
  };

  const handleCallPhone = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string) => {
    const cleanNumber = phone.replace(/[\s+]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleOpenMaps = (address: string) => {
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    alert('Phone number copied!');
  };

  const applyContactHistoryFilters = () => {
    let filtered = [...contactHistory];

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRangeFilter) {
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
        const recordDate = new Date(record.Contact_Date || new Date());
        return recordDate >= filterDate;
      });
    }

    // Contact result filter
    if (resultFilter !== 'all') {
      filtered = filtered.filter(record => record.Contact_Result === resultFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.Contact_Date || new Date()).getTime();
      const dateB = new Date(b.Contact_Date || new Date()).getTime();
      return dateB - dateA;
    });

    setFilteredContactHistory(filtered);
  };

  // Get unique contact results for filter options
  const getUniqueContactResults = () => {
    const results = contactHistory.map(h => h.Contact_Result).filter(Boolean);
    return Array.from(new Set(results)).sort();
  };

  if (isLoadingClient) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6">
            <div className="card animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !client) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold text-gray-900">Client Details</h1>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6">
            <div className="card text-center py-12">
              <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-gray-600 mb-4">{error || 'Client not found'}</p>
              <button onClick={() => router.back()} className="btn-primary">
                Go Back
              </button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const fullAddress = `${client.CA_Line_1}${client.CA_Line_2 ? ', ' + client.CA_Line_2 : ''}, ${client.CA_City}`;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{getClientDisplayName(client)}</h1>
                  <p className="text-sm text-gray-600">ID: {client.user_ID}</p>
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
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contactability History ({filteredContactHistory.length})
              </button>
              <Link
                href={`/clients/${clientId}/history`}
                className="py-4 px-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                📍 Location History
              </Link>
              <Link
                href={`/clients/${clientId}/skip-trace`}
                className="py-4 px-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                📞 Skip Tracing
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          {activeTab === 'details' ? (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              
              {/* Left Column - Main Details */}
              <div className="xl:col-span-3 space-y-6">
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-700">{client.Days_Past_Due || 0}</div>
                      <div className="text-sm text-red-600">Days Past Due</div>
                      <div className="text-xs text-red-500 mt-1">{client.DPD_Bucket || '-'}</div>
                    </div>
                  </div>
                  
                  <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-700">
                        {CurrencyFormatter.format(client.Total_OS_Yesterday1 || 0)}
                      </div>
                      <div className="text-sm text-orange-600">Total Outstanding</div>
                    </div>
                  </div>
                  
                  <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-700">
                        {CurrencyFormatter.format(client.Last_Payment_Amount || 0)}
                      </div>
                      <div className="text-sm text-green-600">Last Payment</div>
                      <div className="text-xs text-green-500 mt-1">
                        {client.Last_Payment_Date ? DateTimeFormatter.format(client.Last_Payment_Date, 'dateOnly') : '-'}
                      </div>
                    </div>
                  </div>
                  
                  {user?.team?.toLowerCase().includes('skorcard') && (
                    <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-700">{client.Buy_Back_Status || '-'}</div>
                        <div className="text-sm text-blue-600">Buy Back Status</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Personal Information */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                        <p className="text-gray-900 font-medium">{client.Full_Name || client.Name1 || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Gender</label>
                        <p className="text-gray-900">{client.Gender || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                        <p className="text-gray-900">
                          {client.Date_of_Birth ? DateTimeFormatter.format(client.Date_of_Birth, 'dateOnly') : '-'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Place of Birth</label>
                        <p className="text-gray-900">{client.Place_of_Birth || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Religion</label>
                        <p className="text-gray-900">{client.Religion || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Nationality</label>
                        <p className="text-gray-900">{client.Nationality || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Marital Status</label>
                        <p className="text-gray-900">{client.Marital_Status || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Spouse Name</label>
                        <p className="text-gray-900">{client.Spouse_Name || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Education</label>
                        <p className="text-gray-900">{client.Education_Details || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Occupation</label>
                        <p className="text-gray-900">{client.Job_Details || client.Occupation || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Position</label>
                        <p className="text-gray-900">{client.Position_Details || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Primary Phone */}
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📱</span>
                        <div>
                          <div className="text-sm text-gray-600">Primary Mobile</div>
                          <div className="font-medium text-gray-900">{client.Mobile || '-'}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {client.Mobile && (
                          <>
                            <button
                              onClick={() => handleCallPhone(client.Mobile)}
                              className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100"
                              title="Call"
                            >
                              📞
                            </button>
                            <button
                              onClick={() => handleWhatsApp(client.Mobile)}
                              className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                              title="WhatsApp"
                            >
                              💬
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Additional Phone Numbers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {client.Home_Phone && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Home Phone</div>
                          <div className="font-medium text-gray-900">{client.Home_Phone}</div>
                        </div>
                      )}
                      {client.Office_Phone && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Office Phone</div>
                          <div className="font-medium text-gray-900">{client.Office_Phone}</div>
                        </div>
                      )}
                      {client.Any_other_phone_No && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Other Phone</div>
                          <div className="font-medium text-gray-900">{client.Any_other_phone_No}</div>
                        </div>
                      )}
                      {/* Show mobile numbers 1-10 */}
                      {[1,2,3,4,5,6,7,8,9,10].map(num => {
                        const mobileField = `Mobile_${num}` as keyof typeof client;
                        const mobileValue = client[mobileField];
                        return mobileValue && typeof mobileValue === 'string' ? (
                          <div key={num} className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">Mobile {num}</div>
                            <div className="font-medium text-gray-900">{mobileValue}</div>
                          </div>
                        ) : null;
                      })}
                    </div>

                    {/* Email */}
                    {client.Email && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">✉️</span>
                          <div>
                            <div className="text-sm text-gray-600">Email</div>
                            <div className="font-medium text-gray-900">{client.Email}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleEmail(client.Email!)}
                          className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100"
                          title="Send Email"
                        >
                          ✉️
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Information */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Address Information</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Current Address */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-800">Correspondance Address (CA)</h3>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="space-y-2 text-sm">
                          <div><strong>Street:</strong> {client.CA_Line_1 || '-'}</div>
                          <div><strong>Line 2:</strong> {client.CA_Line_2 || '-'}</div>
                          <div><strong>RT/RW:</strong> {client.CA_RT_RW || '-'}</div>
                          <div><strong>Sub District:</strong> {client.CA_Sub_District || '-'}</div>
                          <div><strong>District:</strong> {client.CA_District || '-'}</div>
                          <div><strong>City:</strong> {client.CA_City || '-'}</div>
                          <div><strong>Province:</strong> {client.CA_Province || '-'}</div>
                          <div><strong>Zip Code:</strong> {client.CA_ZipCode || '-'}</div>
                        </div>
                        <button
                          onClick={() => handleOpenMaps(fullAddress)}
                          className="mt-3 btn-outline text-sm w-full"
                        >
                          📍 Open in Maps
                        </button>
                      </div>
                    </div>

                    {/* KTP Address */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-800">KTP Address</h3>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="space-y-2 text-sm">
                          <div><strong>Address:</strong> {client.KTP_Address || '-'}</div>
                          <div><strong>Village:</strong> {client.KTP_Village || '-'}</div>
                          <div><strong>District:</strong> {client.KTP_District || '-'}</div>
                          <div><strong>City:</strong> {client.KTP_City || '-'}</div>
                          <div><strong>Province:</strong> {client.KTP_Province || '-'}</div>
                          <div><strong>Postal Code:</strong> {client.KTP_Postal_Code || '-'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Office Address */}
                    {client.Office_Address_City && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-800">Office Address (OA)</h3>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="space-y-2 text-sm">
                            <div><strong>Line 1:</strong> {client.OA_Line_1 || '-'}</div>
                            <div><strong>Line 2:</strong> {client.OA_Line_2 || '-'}</div>
                            <div><strong>RT/RW:</strong> {client.OA_RT_RW || '-'}</div>
                            <div><strong>Sub District:</strong> {client.Office_Address_SubDistrict || '-'}</div>
                            <div><strong>District:</strong> {client.Office_Address_District || '-'}</div>
                            <div><strong>City:</strong> {client.Office_Address_City || '-'}</div>
                            <div><strong>Province:</strong> {client.Office_Address_Province || '-'}</div>
                            <div><strong>Zip Code:</strong> {client.Office_Address_Zipcode || '-'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Emergency Contacts</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {client.Emegency_Contact_Name && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-600">Emergency Contact</div>
                        <div className="font-medium text-gray-900">{client.Emegency_Contact_Name}</div>
                        {client.Emergency_Contact_Phone && (
                          <div className="text-sm text-gray-700 mt-1">{client.Emergency_Contact_Phone}</div>
                        )}
                      </div>
                    )}
                    
                    {client.EC1_Name && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-600">Emergency Contact 1</div>
                        <div className="font-medium text-gray-900">{client.EC1_Name}</div>
                        <div className="text-sm text-gray-700">{client.EC1_Relation || '-'}</div>
                        {client.EC1_Phone && (
                          <div className="text-sm text-gray-700 mt-1">{client.EC1_Phone}</div>
                        )}
                      </div>
                    )}
                    
                    {client.EC2_Name && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-600">Emergency Contact 2</div>
                        <div className="font-medium text-gray-900">{client.EC2_Name}</div>
                        <div className="text-sm text-gray-700">{client.EC2_Relation || '-'}</div>
                        {client.EC2_Phone && (
                          <div className="text-sm text-gray-700 mt-1">{client.EC2_Phone}</div>
                        )}
                      </div>
                    )}
                    
                    {client.Mother_Name && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-600">Mother's Name</div>
                        <div className="font-medium text-gray-900">{client.Mother_Name}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Details */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Financial Details</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600">Current Outstanding</div>
                      <div className="text-xl font-bold text-gray-900">
                        {CurrencyFormatter.format(client.Total_OS_Yesterday1 || 0)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Total OS Yesterday</div>
                    </div>
                    
                    {user?.team?.toLowerCase().includes('skorcard') && (
                      <>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-sm text-gray-600">Last Statement MAD</div>
                          <div className="text-xl font-bold text-gray-900">
                            {CurrencyFormatter.format(client.Last_Statement_MAD || 0)}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Date: {client.Last_Statement_Date ? DateTimeFormatter.format(client.Last_Statement_Date, 'dateOnly') : '-'}
                          </div>
                        </div>
                        
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-sm text-gray-600">Last Statement TAD</div>
                          <div className="text-xl font-bold text-gray-900">
                            {CurrencyFormatter.format(client.Last_Statement_TAD || 0)}
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600">Repayment Amount</div>
                      <div className="text-xl font-bold text-gray-900">
                        {CurrencyFormatter.format(client.Repayment_Amount || 0)}
                      </div>
                    </div>
                    
                    {user?.team?.toLowerCase().includes('skorcard') && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-600">Buyback Amount</div>
                        <div className="text-xl font-bold text-gray-900">
                          {CurrencyFormatter.format(client.Buyback_Amount_Paid_By_Skor1 || 0)}
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600">Credit Limit</div>
                      <div className="text-xl font-bold text-gray-900">
                        {client.Credit_Limit ? CurrencyFormatter.format(client.Credit_Limit) : 'N/A'}
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600">Age in Bank</div>
                      <div className="text-xl font-bold text-gray-900">{client.Age_in_Bank || 0}</div>
                      <div className="text-xs text-gray-600 mt-1">Days</div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600">Latest Due Date</div>
                      <div className="text-lg font-bold text-gray-900">
                        {client.Latest_Statement_Due_Date ? DateTimeFormatter.format(client.Latest_Statement_Due_Date, 'dateOnly') : 'N/A'}
                      </div>
                    </div>

                    {user?.team?.toLowerCase().includes('skorcard') && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-600">Buy Back Status</div>
                        <div className="text-lg font-bold text-gray-900">{client.Buy_Back_Status || 'N/A'}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* EMI Restructuring */}
                {user?.team?.toLowerCase().includes('skorcard') && emiRestructuring && (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">EMI Restructuring</h2>
                      {isLoadingEMI && (
                        <div className="ml-2 w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-600">Original Due Amount</div>
                        <div className="text-xl font-bold text-gray-900">
                          {CurrencyFormatter.format(emiRestructuring.Original_Due_Amount || 0)}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-600">Current Due Amount</div>
                        <div className="text-xl font-bold text-gray-900">
                          {CurrencyFormatter.format(emiRestructuring.Current_Due_Amount || 0)}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-600">Total Paid Amount</div>
                        <div className="text-xl font-bold text-gray-900">
                          {CurrencyFormatter.format(emiRestructuring.Total_Paid_Amount || 0)}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-600">Restructure Due Date</div>
                        <div className="text-lg font-bold text-gray-900">
                          {emiRestructuring.Due_Date ? DateTimeFormatter.format(emiRestructuring.Due_Date, 'dateOnly') : 'N/A'}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-600">Restructure Tenure</div>
                        <div className="text-lg font-bold text-gray-900">{emiRestructuring.Tenure || 'N/A'} months</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Work Information */}
                {(client.Company_Name || client.Job_Details) && (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Work Information</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Company Name</label>
                          <p className="text-gray-900 font-medium">{client.Company_Name || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Job Details</label>
                          <p className="text-gray-900">{client.Job_Details || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Position Details</label>
                          <p className="text-gray-900">{client.Position_Details || '-'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Length of Work</label>
                          <p className="text-gray-900">{client.Length_of_Work || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Department</label>
                          <p className="text-gray-900">{client.Department || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating Add Contactability Button */}
                <Link 
                  href={`/clients/${clientId}/contact`}
                  className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
                  title="Add Contactability"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>
              </div>

              {/* Right Sidebar - Meta Info */}
              <div className="xl:col-span-1 space-y-6">
                
                {/* Record Information */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Record Info</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Record ID</label>
                      <p className="text-gray-900 font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                        {client.id}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">User ID</label>
                      <p className="text-gray-900 font-medium">{client.User_ID || client.user_ID || '-'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Customer ID</label>
                      <p className="text-gray-900">{client.Customer_ID || '-'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Record Status</label>
                      <p className="text-gray-900">{client.Record_Status__s || '-'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">FI Owner</label>
                      <p className="text-gray-900 text-sm">{client.FI_Owner || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Activity Information */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Created Time</label>
                      <p className="text-gray-900 text-sm">
                        {client.Created_Time ? DateTimeFormatter.format(client.Created_Time, 'full') : '-'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Activity</label>
                      <p className="text-gray-900 text-sm">
                        {client.Last_Activity_Time ? DateTimeFormatter.format(client.Last_Activity_Time, 'full') : '-'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Visit</label>
                      <p className="text-gray-900 text-sm">
                        {client.Last_Visited_Time ? DateTimeFormatter.format(client.Last_Visited_Time, 'full') : '-'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Days Visited</label>
                      <p className="text-gray-900 font-medium">{client.Days_Visited || 0}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Number of Chats</label>
                      <p className="text-gray-900 font-medium">{client.Number_Of_Chats || 0}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Avg Time Spent</label>
                      <p className="text-gray-900">{client.Average_Time_Spent_Minutes || 0} minutes</p>
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">System</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">RoboCall Status</label>
                      <p className="text-gray-900">{client.RoboCall_30_60_LastStatus || '-'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Vapi RoboCall</label>
                      <p className="text-gray-900">{client.Vapi_Robocall || '-'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Call Action</label>
                      <p className="text-gray-900">{client.Last_Call_Action_Status || '-'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email Opt Out</label>
                      <p className="text-gray-900">{client.Email_Opt_Out ? 'Yes' : 'No'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">WhatsApp Opt Out</label>
                      <p className="text-gray-900">{client.woztellplatformintegration__WhatsApp_Opt_Out ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                {(client.Owner || client.Created_By || client.Modified_By) && (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Ownership</h2>
                    </div>
                    
                    <div className="space-y-4">
                      {client.Owner && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Owner</label>
                          <p className="text-gray-900 font-medium">{client.Owner.name}</p>
                          <p className="text-xs text-gray-500">{client.Owner.email}</p>
                        </div>
                      )}
                      
                      {client.Created_By && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Created By</label>
                          <p className="text-gray-900 font-medium">{client.Created_By.name}</p>
                          <p className="text-xs text-gray-500">{client.Created_By.email}</p>
                        </div>
                      )}
                      
                      {client.Modified_By && client.Modified_By.id !== client.Created_By?.id && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Last Modified By</label>
                          <p className="text-gray-900 font-medium">{client.Modified_By.name}</p>
                          <p className="text-xs text-gray-500">{client.Modified_By.email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {client.Modified_Time ? DateTimeFormatter.format(client.Modified_Time, 'full') : '-'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Contact History Tab */
            <div className="space-y-4">
              {/* Statistics */}
              {!isLoadingHistory && contactHistory.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card">
                    <div className="text-sm text-gray-600 mb-1">Total Contacts</div>
                    <div className="text-2xl font-bold text-gray-900">{filteredContactHistory.length}</div>
                  </div>
                  <div className="card">
                    <div className="text-sm text-gray-600 mb-1">Visits</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {filteredContactHistory.filter(h => h.Channel === 'Visit').length}
                    </div>
                  </div>
                  <div className="card">
                    <div className="text-sm text-gray-600 mb-1">Calls</div>
                    <div className="text-2xl font-bold text-green-600">
                      {filteredContactHistory.filter(h => h.Channel === 'Call').length}
                    </div>
                  </div>
                  <div className="card">
                    <div className="text-sm text-gray-600 mb-1">Messages</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {filteredContactHistory.filter(h => h.Channel === 'Message').length}
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              {!isLoadingHistory && contactHistory.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Range
                      </label>
                      <select
                        value={dateRangeFilter}
                        onChange={(e) => setDateRangeFilter(e.target.value)}
                        className="input-field"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="last7days">Last 7 Days</option>
                        <option value="last30days">Last 30 Days</option>
                        <option value="thisMonth">This Month</option>
                      </select>
                    </div>

                    {/* Contact Result Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Result
                      </label>
                      <select
                        value={resultFilter}
                        onChange={(e) => setResultFilter(e.target.value)}
                        className="input-field"
                      >
                        <option value="all">All Results</option>
                        {getUniqueContactResults().map((result) => (
                          <option key={result} value={result}>
                            {result}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {isLoadingHistory ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : contactHistory.length === 0 ? (
                <div className="card text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600 mb-4">No contact history yet</p>
                  <Link href={`/clients/${clientId}/contact`} className="btn-primary inline-block">
                    Add First Contact
                  </Link>
                </div>
              ) : filteredContactHistory.length === 0 ? (
                <div className="card text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600 mb-4">No contacts match the selected filters</p>
                  <button
                    onClick={() => {
                      setDateRangeFilter('all');
                      setResultFilter('all');
                    }}
                    className="btn-outline"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  {filteredContactHistory.map((contact) => {
                    const handleClick = (e: React.MouseEvent) => {
                      e.preventDefault();
                      // Store data in sessionStorage for clean URL
                      sessionStorage.setItem(`contactability_${contact.id}`, JSON.stringify(contact));
                      // Navigate to detail page
                      window.location.href = `/contactability/${contact.id}`;
                    };
                    
                    return (
                      <a
                        key={contact.id} 
                        href={`/contactability/${contact.id}`}
                        onClick={handleClick}
                        className="card hover:shadow-lg transition-shadow cursor-pointer block"
                      >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              contact.Channel === 'Visit' 
                                ? 'bg-blue-100 text-blue-800'
                                : contact.Channel === 'Call'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {contact.Channel}
                            </span>
                            {contact.Visit_Action && (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                contact.Visit_Action === 'OPC'
                                  ? 'bg-green-100 text-green-800'
                                  : contact.Visit_Action === 'RPC'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {contact.Visit_Action}
                              </span>
                            )}
                          </div>
                          <div className="text-base font-bold text-gray-900 mb-1">
                            {contact.Contact_Result}
                          </div>
                          <div className="text-sm text-gray-500">
                            {DateTimeFormatter.format(contact.Contact_Date, 'full')}
                          </div>
                        </div>
                        <div className="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap ml-4">
                          View Details →
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                        {contact.Person_Contacted && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">Person Contacted</div>
                            <div className="text-sm font-medium text-gray-900">{contact.Person_Contacted}</div>
                          </div>
                        )}
                        
                        {contact.Visit_Status && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">Visit Status</div>
                            <div className="text-sm text-gray-900">{contact.Visit_Status}</div>
                          </div>
                        )}

                        {contact.Visit_Location && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">Location</div>
                            <div className="text-sm text-gray-900">{contact.Visit_Location}</div>
                          </div>
                        )}

                        {contact.Agent_Name && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">Agent</div>
                            <div className="text-sm font-medium text-gray-900">{contact.Agent_Name}</div>
                          </div>
                        )}

                        {contact.Message_Type && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">Message Type</div>
                            <div className="text-sm text-gray-900">{contact.Message_Type}</div>
                          </div>
                        )}

                        {(contact.latitude && contact.longitude) && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">Coordinates</div>
                            <div className="text-xs font-mono text-gray-700">
                              {contact.latitude}, {contact.longitude}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Notes Preview */}
                      {(contact.Visit_Notes || contact.Call_Notes || contact.Message_Content) && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <div className="text-xs font-medium text-gray-500 mb-1">Notes</div>
                          <div className="text-sm text-gray-700 line-clamp-2">
                            {contact.Visit_Notes || contact.Call_Notes || contact.Message_Content}
                          </div>
                        </div>
                      )}
                    </a>
                  );
                  })}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
