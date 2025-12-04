'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/store/authStore';
import { apiClient } from '@/lib/api/client';
import { DateTimeFormatter } from '@/lib/utils/formatters';

interface ContactabilityDetail {
  id: string;
  Channel: string;
  Contact_Result: string;
  Contact_Date?: string;
  Person_Contacted?: string;
  Visit_Notes?: string;
  Call_Notes?: string;
  Message_Content?: string;
  Created_Time: string;
  Modified_Time: string;
  Visit_Date?: string;
  User_ID?: {
    name: string;
    id: string;
  };
  Skor_User_ID?: string;
  Visit_Agent?: string;
  Call_Agent?: string;
  Agent_Name?: string;
  Vist_Action?: string;
  Visit_Action?: string;
  If_Connected?: string;
  Visit_Location?: string;
  Visit_Status?: string;
  Visit_Lat_Long?: string;
  latitude?: string;
  longitude?: string;
  Mobile?: string;
  Message_Type?: string;
  Visit_Image_1?: string;
  Visit_Image_2?: string;
  Visit_Image_3?: string;
  Recording?: string;
  Owner?: {
    name: string;
    id: string;
    email: string;
  };
  Created_By?: {
    name: string;
    id: string;
    email: string;
  };
  Modified_By?: {
    name: string;
    id: string;
    email: string;
  };
  Visit_by_Skor_Team?: string;
  Reachability?: string;
  DPD_Bucket?: string;
  Contactability?: string;
  Visit_Agent_Team_Lead?: string;
  FI_Owner?: string;
  Any_other_phone_No?: string;
  New_Phone_Number?: string;
  New_Address?: string;
  Agent_WA_Notes?: string;
  Educational_Call_Notes?: string;
}

export default function ContactabilityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;
  const user = useAuthStore((state) => state.user);

  const [record, setRecord] = useState<ContactabilityDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'contactHistory' | 'contactability'>('contactability');

  useEffect(() => {
    // Check if data is stored in sessionStorage (from contact history)
    const storageKey = `contactability_${recordId}`;
    const storedData = sessionStorage.getItem(storageKey);
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setRecord(parsedData);
        setDataSource('contactHistory');
        setIsLoading(false);
        // Clean up after reading
        sessionStorage.removeItem(storageKey);
      } catch (e) {
        console.error('Failed to parse stored contact data:', e);
        fetchContactabilityDetail();
      }
    } else {
      fetchContactabilityDetail();
    }
  }, [recordId]);

  const fetchContactabilityDetail = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    setError('');

    try {
      // Get all contactability records first
      const response = await apiClient.post('/webhook/d540950f-85d2-4e2b-a054-7e5dfcef0379', {
        fi_owner: user.email,
      });

      if (response.data && Array.isArray(response.data)) {
        const allRecords = response.data[0]?.data || [];
        const foundRecord = allRecords.find((r: ContactabilityDetail) => r.id === recordId);
        
        if (foundRecord) {
          setRecord(foundRecord);
          setDataSource('contactability');
        } else {
          setError('Record not found');
        }
      }
    } catch (error: any) {
      console.error('Fetch contactability detail error:', error);
      setError('Failed to load record details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewLocation = (latLong?: string, lat?: string, lng?: string) => {
    if (latLong) {
      const [latitude, longitude] = latLong.split(',');
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
    } else if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  const getChannelIcon = (channel: string) => {
    if (channel === 'Field Visit') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    } else if (channel === 'Call') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      );
    }
  };

  const getChannelColor = (channel: string) => {
    if (channel === 'Field Visit' || channel === 'Visit') return 'bg-blue-100 text-blue-800';
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

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !record) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={() => router.back()} className="btn-primary">
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getChannelColor(record.Channel)}`}>
                  {getChannelIcon(record.Channel)}
                  {record.Channel}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Contactability Details</h1>
                  <p className="text-sm text-gray-600">
                    {DateTimeFormatter.format(
                      record.Contact_Date || record.Visit_Date || record.Created_Time, 
                      'full'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Left Column - Main Info */}
            <div className="xl:col-span-3 space-y-6">
              
              {/* Summary Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Client Info Card */}
                <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Client</h3>
                      <p className="text-sm text-gray-600">Basic Info</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Name</p>
                      <p className="text-gray-900 font-medium">{record.User_ID?.name || 'Unknown Client'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Mobile</p>
                      <p className="text-gray-900">{record.Mobile || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Result Card */}
                <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      {getChannelIcon(record.Channel)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Result</h3>
                      <p className="text-sm text-gray-600">{record.Channel}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getResultColor(record.Contact_Result)}`}>
                      {record.Contact_Result}
                    </span>
                    {record.Person_Contacted && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Person Contacted</p>
                        <p className="text-gray-900">{record.Person_Contacted}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent Info Card */}
                <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Agent</h3>
                      <p className="text-sm text-gray-600">Contact Info</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Visit Agent</p>
                      <p className="text-gray-900">{record.Agent_Name || record.Visit_Agent || record.Call_Agent || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Visit Agent Team Lead</p>
                      <p className="text-gray-900">{record.Visit_Agent_Team_Lead || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Visit by Skor Team</p>
                      <p className="text-gray-900">{record.Visit_by_Skor_Team || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visit/Call Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Visit Details */}
                {(record.Channel === 'Field Visit' || record.Channel === 'Visit') && (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Visit Details</h2>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {(record.Visit_Action || record.Vist_Action || record.If_Connected) && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Visit Action</label>
                            <p className="text-gray-900 font-medium">
                              {record.Visit_Action || record.Vist_Action || record.If_Connected}
                            </p>
                          </div>
                        )}
                        {record.Visit_Status && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Visit Status</label>
                            <p className="text-gray-900 font-medium">{record.Visit_Status}</p>
                          </div>
                        )}
                        {record.Reachability && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Reachability</label>
                            <p className="text-gray-900 font-medium">{record.Reachability}</p>
                          </div>
                        )}
                      </div>
                      
                      {record.Visit_Location && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Visit Location</label>
                          <p className="text-gray-900">{record.Visit_Location}</p>
                        </div>
                      )}

                      {(record.Visit_Lat_Long || (record.latitude && record.longitude)) && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Coordinates</label>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {record.Visit_Lat_Long || `${record.latitude}, ${record.longitude}`}
                            </p>
                            <button
                              onClick={() => handleViewLocation(record.Visit_Lat_Long, record.latitude, record.longitude)}
                              className="btn-outline text-xs px-3 py-1"
                            >
                              📍 View Map
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {record.Visit_Notes && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Visit Notes</label>
                          <div className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-gray-900">{record.Visit_Notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Additional Info</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">DPD Bucket</label>
                        <p className="text-gray-900">{record.DPD_Bucket || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Contactability</label>
                        <p className="text-gray-900">{record.Contactability || '-'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">FI Owner</label>
                      <p className="text-gray-900">{record.FI_Owner || '-'}</p>
                    </div>
                    
                    {record.Any_other_phone_No && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Other Phone Number</label>
                        <p className="text-gray-900">{record.Any_other_phone_No}</p>
                      </div>
                    )}
                    
                    {record.New_Phone_Number && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">New Phone Number</label>
                        <p className="text-gray-900">{record.New_Phone_Number}</p>
                      </div>
                    )}
                    
                    {record.New_Address && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">New Address</label>
                        <p className="text-gray-900">{record.New_Address}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Call Notes (if Call) */}
              {record.Channel === 'Call' && record.Call_Notes && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Call Details</h2>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-gray-900">{record.Call_Notes}</p>
                  </div>
                </div>
              )}

              {/* Message Content (if Message) */}
              {record.Channel === 'Message' && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Message Details</h2>
                  </div>
                  <div className="space-y-3">
                    {record.Message_Type && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Message Type</label>
                        <p className="text-gray-900 font-medium">{record.Message_Type}</p>
                      </div>
                    )}
                    {record.Message_Content && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Message Content</label>
                        <div className="mt-1 p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-gray-900">{record.Message_Content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Visit Images */}
              {(record.Visit_Image_1 || record.Visit_Image_2 || record.Visit_Image_3) && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Visit Images</h2>
                    <span className="text-sm text-gray-500 ml-auto">Click to view full screen</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {record.Visit_Image_1 && (
                      <div>
                        <div 
                          className="bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 border-gray-200 hover:border-blue-500"
                          onClick={() => setSelectedImage(record.Visit_Image_1!)}
                        >
                          <img
                            src={record.Visit_Image_1}
                            alt="Visit Image 1"
                            className="w-full h-64 object-cover"
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2 text-center">Image 1</p>
                      </div>
                    )}
                    
                    {record.Visit_Image_2 && (
                      <div>
                        <div 
                          className="bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 border-gray-200 hover:border-blue-500"
                          onClick={() => setSelectedImage(record.Visit_Image_2!)}
                        >
                          <img
                            src={record.Visit_Image_2}
                            alt="Visit Image 2"
                            className="w-full h-64 object-cover"
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2 text-center">Image 2</p>
                      </div>
                    )}
                    
                    {record.Visit_Image_3 && (
                      <div>
                        <div 
                          className="bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 border-gray-200 hover:border-blue-500"
                          onClick={() => setSelectedImage(record.Visit_Image_3!)}
                        >
                          <img
                            src={record.Visit_Image_3}
                            alt="Visit Image 3"
                            className="w-full h-64 object-cover"
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2 text-center">Image 3</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Meta Info */}
            <div className="xl:col-span-1 space-y-6">
              
              {/* Record Metadata */}
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
                      {record.id}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="text-gray-900 text-sm">{DateTimeFormatter.format(record.Created_Time, 'full')}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Modified</label>
                    <p className="text-gray-900 text-sm">{DateTimeFormatter.format(record.Modified_Time, 'full')}</p>
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              {(record.Owner || record.Created_By || record.Modified_By) && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Ownership</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {record.Owner && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Owner</label>
                        <p className="text-gray-900 font-medium">{record.Owner.name}</p>
                        <p className="text-xs text-gray-500">{record.Owner.email}</p>
                      </div>
                    )}
                    
                    {record.Created_By && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Created By</label>
                        <p className="text-gray-900 font-medium">{record.Created_By.name}</p>
                        <p className="text-xs text-gray-500">{record.Created_By.email}</p>
                      </div>
                    )}
                    
                    {record.Modified_By && record.Modified_By.id !== record.Created_By?.id && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Last Modified By</label>
                        <p className="text-gray-900 font-medium">{record.Modified_By.name}</p>
                        <p className="text-xs text-gray-500">{record.Modified_By.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-8"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                src={selectedImage}
                alt="Visit Image Full Size"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  maxWidth: 'calc(100vw - 4rem)', 
                  maxHeight: 'calc(100vh - 4rem)' 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}