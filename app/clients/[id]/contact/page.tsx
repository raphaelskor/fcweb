'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/store/authStore';
import { apiAuth, apiClient } from '@/lib/api/client';
import { Client } from '@/lib/types';
import { getClientDisplayName } from '@/lib/utils/formatters';

type Channel = 'Visit' | 'Call' | 'Message';

// Field options configurations
const PERSON_CONTACTED_OPTIONS = [
  'Debtor',
  'Spouse',
  'Son',
  'Daughter',
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'House Assistant',
  'House Security',
  'Area Security',
  'Office Security',
  'Receptionist',
  'Guest',
  'Neighbor',
  'Emergency Contact',
];

const ACTION_LOCATION_OPTIONS = {
  Visit: [
    'Alamat Korespondensi',
    'Alamat Kantor',
    'Alamat Rumah',
    'Alamat KTP',
    'Alamat Lain',
  ],
  Call: [
    'Customer Mobile',
    'Econ 1',
    'Econ 2',
    'Office',
    'Skip Tracing Number',
    'Phone Contact',
  ],
  Message: [
    'Customer Mobile',
    'Econ 1',
    'Econ 2',
    'Office',
    'Skip Tracing Number',
    'Phone Contact',
  ],
};

const CONTACT_RESULT_OPTIONS = {
  Visit: [
    // Visit-specific results
    'Alamat Ditemukan, Rumah Kosong',
    'Dilarang Masuk Perumahan',
    'Dilarang Masuk Kantor',
    'Menghindar',
    'Titip Surat',
    'Alamat Tidak Ditemukan',
    'Alamat Salah',
    'Konsumen Tidak Dikenal',
    'Pindah, Tidak Ditemukan',
    'Pindah, Alamat Baru',
    'Meninggal Dunia',
    'Mengundurkan Diri',
    'Berhenti Bekerja',
    'Sedang Renovasi',
    'Bencana Alam',
    'Kondisi Medis',
    'Sengketa Hukum',
    'Kunjungan Ulang',
    // Common results
    'Promise to Pay (PTP)',
    'Negotiation',
    'Hot Prospect',
    'Already Paid',
    'Refuse to Pay',
    'Dispute',
    'Not Recognized',
    'Partial Payment',
    'Failed to Pay',
  ],
  Call: [
    // Call-specific results
    'Leave a Message',
    'Hang Up',
    'Rejected',
    'No Answer',
    'Busy',
    'Mailbox',
    'Invalid Number',
    'Unreachable',
    // Common results
    'Promise to Pay (PTP)',
    'Negotiation',
    'Hot Prospect',
    'Already Paid',
    'Refuse to Pay',
    'Dispute',
    'Not Recognized',
    'Partial Payment',
    'Failed to Pay',
  ],
  Message: [
    // Message-specific results
    'WA One Tick',
    'WA Two Tick',
    'WA Blue Tick',
    'WA Not Registered',
    'SP 1',
    'SP 2',
    'SP 3',
    // Common results
    'Promise to Pay (PTP)',
    'Negotiation',
    'Hot Prospect',
    'Already Paid',
    'Refuse to Pay',
    'Dispute',
    'Not Recognized',
    'Partial Payment',
    'Failed to Pay',
  ],
};

export default function ContactabilityFormPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const user = useAuthStore((state) => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [client, setClient] = useState<Client | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-filled fields
  const [contactDate, setContactDate] = useState('');
  const [contactTime, setContactTime] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Form fields
  const [channel, setChannel] = useState<Channel>('Visit');
  const [personContacted, setPersonContacted] = useState('');
  const [actionLocation, setActionLocation] = useState('');
  const [contactResult, setContactResult] = useState('');
  const [notes, setNotes] = useState('');
  const [agentName, setAgentName] = useState('');

  // PTP fields (conditional)
  const [ptpAmount, setPtpAmount] = useState('');
  const [ptpDate, setPtpDate] = useState('');

  // Optional fields
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newAddress, setNewAddress] = useState('');

  // Images
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    fetchClientDetails();
    initializeDateTime();
    if (channel === 'Visit') {
      getCurrentLocation();
    }
  }, [clientId]);

  useEffect(() => {
    // Reset channel-specific fields when channel changes
    setActionLocation('');
    setContactResult('');
    setPtpAmount('');
    setPtpDate('');
    setNotes('');
    setAgentName('');
    
    // Reset images if switching to Call
    if (channel === 'Call') {
      setPhotos([]);
    }
    
    // Get location for Visit channel
    if (channel === 'Visit' && !latitude) {
      getCurrentLocation();
    }
  }, [channel]);

  const initializeDateTime = () => {
    // Get current time in Jakarta timezone (UTC+7)
    const jakartaTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    
    // Format date as YYYY-MM-DD
    const year = jakartaTime.getFullYear();
    const month = String(jakartaTime.getMonth() + 1).padStart(2, '0');
    const day = String(jakartaTime.getDate()).padStart(2, '0');
    setContactDate(`${year}-${month}-${day}`);
    
    // Format time as HH:MM
    const hours = String(jakartaTime.getHours()).padStart(2, '0');
    const minutes = String(jakartaTime.getMinutes()).padStart(2, '0');
    setContactTime(`${hours}:${minutes}`);
  };

  const fetchClientDetails = async () => {
    if (!user?.email) return;

    setIsLoadingClient(true);

    try {
      const response = await apiAuth.post('/webhook/a307571b-e8c4-45d2-9244-b40305896648', {
        fi_owner: user.email,
      });

      if (response.data && Array.isArray(response.data)) {
        const clientsData = response.data[0]?.data || [];
        const foundClient = clientsData.find((c: Client) => c.id === clientId);

        if (foundClient) {
          setClient(foundClient);
        }
      }
    } catch (error: any) {
      console.error('Fetch client error:', error);
    } finally {
      setIsLoadingClient(false);
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to retrieve location. Please enable location services.');
        setIsGettingLocation(false);
      }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const maxPhotos = 3;
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Validate file count
    if (photos.length + files.length > maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    // Validate file size
    for (const file of files) {
      if (file.size > maxSize) {
        alert(`File ${file.name} exceeds 5MB limit`);
        return;
      }
    }

    setPhotos([...photos, ...files]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const formatCurrency = (value: string): string => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    
    if (!digits) return '';
    
    // Format with thousand separators
    const formatted = new Intl.NumberFormat('id-ID').format(parseInt(digits));
    
    return `Rp ${formatted}`;
  };

  const handlePtpAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setPtpAmount(formatted);
  };

  const extractPtpAmountDigits = (formatted: string): string => {
    return formatted.replace(/\D/g, '');
  };

  const handleNewPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    setNewPhoneNumber(value);
  };

  const getMinPtpDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxPtpDate = (): string => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 5);
    return maxDate.toISOString().split('T')[0];
  };

  const isPtpDateValid = (dateString: string): boolean => {
    const date = new Date(dateString);
    const day = date.getDay();
    
    // Check if Sunday (0)
    if (day === 0) {
      return false;
    }
    
    return true;
  };

  const validateForm = (): string | null => {
    // Common validations
    if (!personContacted) return 'Person Contacted is required';
    if (!actionLocation) return 'Action Location is required';
    if (!contactResult) return 'Contact Result is required';
    if (!notes.trim()) return 'Notes are required';
    
    // Agent Name validation for non-Skorcard users
    const isSkorcard = user?.team?.toLowerCase().includes('skorcard');
    if (!isSkorcard && !agentName.trim()) return 'Agent Name is required';

    // Channel-specific validations
    if (channel === 'Visit') {
      if (!latitude || !longitude) return 'Location is required for Visit';
      if (photos.length === 0) return 'At least 1 photo is required for Visit';
    }

    if (channel === 'Message') {
      if (photos.length === 0) return 'At least 1 photo is required for Message';
    }

    // PTP validations
    if (contactResult === 'Promise to Pay (PTP)') {
      if (!ptpAmount) return 'PTP Amount is required';
      if (!ptpDate) return 'PTP Date is required';
      if (!isPtpDateValid(ptpDate)) return 'PTP Date cannot be on Sunday';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine Visit_by_Skor_Team based on user's team
      const visitBySkorTeam = user?.team?.toLowerCase().includes('skorcard') ? 'Yes' : 'No';
      const isSkorcard = user?.team?.toLowerCase().includes('skorcard');

      // Build payload
      const payload: any = {
        id: clientId,
        User_ID: client?.User_ID || '',
        Channel: channel,
        FI_Owner: user?.email || '',
        Person_Contacted: personContacted,
        Action_Location: actionLocation,
        Contact_Result: contactResult,
        Visit_Notes: notes,
        Visit_by_Skor_Team: visitBySkorTeam,
        Visit_Agent: isSkorcard ? (user?.name || '') : agentName,
        Visit_Agent_Team_Lead: user?.team || '',
      };

      // Add location for Visit channel (NO SPACE after comma!)
      if (channel === 'Visit') {
        const latFixed = parseFloat(latitude).toFixed(6);
        const lngFixed = parseFloat(longitude).toFixed(6);
        payload.Visit_Lat_Long = `${latFixed},${lngFixed}`;
      }

      // Add PTP fields if applicable
      if (contactResult === 'Promise to Pay (PTP)') {
        payload.P2p_Amount = extractPtpAmountDigits(ptpAmount);
        payload.P2p_Date = ptpDate;
      }

      // Add optional fields
      if (newPhoneNumber) {
        // Format phone: +62XXXXXXXXX (no separator, no space)
        let digits = newPhoneNumber.replace(/\D/g, '');
        
        // Remove leading 0 if exists
        if (digits.startsWith('0')) {
          digits = digits.substring(1);
        }
        
        // Add 62 prefix if not exists
        if (!digits.startsWith('62')) {
          digits = '62' + digits;
        }
        
        payload.New_Phone_Number = `+${digits}`;
      }
      if (newAddress.trim()) {
        payload.New_Address = newAddress;
      }

      console.log('Submitting payload:', payload);

      // Always use FormData
      const formData = new FormData();
      
      // Add each field from payload to FormData
      Object.keys(payload).forEach(key => {
        formData.append(key, payload[key]);
      });

      // Add photos if any (use lowercase field names: image1, image2, image3 for API submission)
      photos.forEach((photo, index) => {
        formData.append(`image${index + 1}`, photo, photo.name);
      });

      console.log('Submitting with FormData');
      console.log('Has images:', photos.length > 0);
      
      const response = await apiClient.post(
        '/webhook/95709b0d-0d03-4710-85d5-d72f14359ee4',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('API Response:', response);

      // Check if response is successful
      if (response.status === 200 || response.status === 201) {
        alert('Contactability saved successfully!');
        router.push(`/clients/${clientId}`);
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      alert('Failed to save contactability. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNotesLabel = (): string => {
    switch (channel) {
      case 'Visit':
        return 'Visit Notes';
      case 'Call':
        return 'Call Notes';
      case 'Message':
        return 'Message Content';
      default:
        return 'Notes';
    }
  };

  const getNotesPlaceholder = (): string => {
    switch (channel) {
      case 'Visit':
        return 'Describe what happened during the visit...';
      case 'Call':
        return 'Describe what happened during the call...';
      case 'Message':
        return 'Enter the message sent to the client...';
      default:
        return 'Enter notes...';
    }
  };

  const showPtpFields = contactResult === 'Promise to Pay (PTP)';
  const showImages = channel === 'Visit' || channel === 'Message';
  const showLocation = channel === 'Visit';

  if (isLoadingClient) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!client) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Client not found</p>
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
              <div>
                <h1 className="text-xl font-bold text-gray-900">Add Contactability</h1>
                <p className="text-sm text-gray-600">{getClientDisplayName(client)}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Form */}
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Information */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{getClientDisplayName(client)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{client.Mobile || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <span className="font-medium text-right ml-4">
                    {[client.CA_Line_1, client.CA_Line_2, client.CA_City].filter(Boolean).join(', ') || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contactability Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="text"
                    value={contactDate}
                    readOnly
                    className="input-field bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="text"
                    value={contactTime}
                    readOnly
                    className="input-field bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Location (Visit only) */}
            {showLocation && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Location <span className="text-red-500">*</span>
                  </h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="btn-outline text-sm"
                    >
                      {isGettingLocation ? 'Getting...' : '🔄 Refresh'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (latitude && longitude) {
                          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
                          window.open(mapsUrl, '_blank');
                        } else {
                          alert('Please get location first');
                        }
                      }}
                      disabled={!latitude || !longitude}
                      className="btn-outline text-sm"
                      title="Open in Google Maps"
                    >
                      🗺️ Maps
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                    <input
                      type="text"
                      value={latitude}
                      readOnly
                      className="input-field bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                    <input
                      type="text"
                      value={longitude}
                      readOnly
                      className="input-field bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Channel Selection */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Channel <span className="text-red-500">*</span></h2>
              <div className="grid grid-cols-3 gap-4">
                {(['Visit', 'Call', 'Message'] as Channel[]).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`p-4 rounded-lg border-2 font-medium transition-colors ${
                      channel === ch
                        ? 'border-primary-600 bg-primary-50 text-primary-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {ch === 'Visit' && '🚶'}
                    {ch === 'Call' && '📞'}
                    {ch === 'Message' && '💬'}
                    <div className="mt-2">{ch}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Person Contacted */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Person Contacted <span className="text-red-500">*</span>
              </h2>
              <select
                value={personContacted}
                onChange={(e) => setPersonContacted(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select Person Contacted</option>
                {PERSON_CONTACTED_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Agent Name (Non-Skorcard users only) */}
            {!user?.team?.toLowerCase().includes('skorcard') && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Agent Name <span className="text-red-500">*</span>
                </h2>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Enter agent name"
                  className="input-field"
                  required
                />
              </div>
            )}

            {/* Action Location */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Action Location <span className="text-red-500">*</span>
              </h2>
              <select
                value={actionLocation}
                onChange={(e) => setActionLocation(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select Action Location</option>
                {ACTION_LOCATION_OPTIONS[channel].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload (Visit & Message only) */}
            {showImages && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Photos (1-3 images) <span className="text-red-500">*</span>
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photos.length >= 3}
                      className="btn-outline flex-1"
                    >
                      📷 Camera / Gallery
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    {photos.length}/3 images uploaded (minimum 1 required)
                  </p>
                </div>
              </div>
            )}

            {/* Contact Result (Required) */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Result <span className="text-red-500">*</span>
              </h2>
              <select
                value={contactResult}
                onChange={(e) => setContactResult(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select Contact Result</option>
                {CONTACT_RESULT_OPTIONS[channel].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* PTP Fields (Conditional) */}
            {showPtpFields && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Promise to Pay Details <span className="text-red-500">*</span>
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PTP Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ptpAmount}
                      onChange={handlePtpAmountChange}
                      placeholder="e.g., 1000000"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PTP Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={ptpDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (isPtpDateValid(e.target.value)) {
                          setPtpDate(e.target.value);
                        } else {
                          alert('PTP Date cannot be on Sunday');
                          setPtpDate('');
                        }
                      }}
                      min={getMinPtpDate()}
                      max={getMaxPtpDate()}
                      className="input-field"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Date range: Today to {new Date(getMaxPtpDate()).toLocaleDateString()} (no Sundays)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {getNotesLabel()} <span className="text-red-500">*</span>
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={getNotesPlaceholder()}
                className="input-field h-24 resize-none"
                required
              />
            </div>

            {/* Optional Fields */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information (Optional)</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Phone Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      +62
                    </span>
                    <input
                      type="text"
                      value={newPhoneNumber}
                      onChange={handleNewPhoneChange}
                      placeholder="8123456789"
                      className="input-field rounded-l-none flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Address
                  </label>
                  <textarea
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="New address found during contact..."
                    className="input-field h-20 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 btn-outline"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Contactability'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
