'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/store/authStore';
import { apiClient } from '@/lib/api/client';

interface DashboardStats {
  Visit_Count: number;
  Call_Count: number;
  Message_Count: number;
  RPC_Count: number;
  TPC_Count: number;
  OPC_Count: number;
  PTP_Count: number;
  PTP_Count_This_Month: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/webhook/e3f3398d-ff5a-4ce6-9cee-73ab201119fb', {
        fi_owner: user.email,
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setStats(response.data[0]);
      }
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.name}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
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
              <button onClick={fetchDashboardStats} className="ml-4 underline">
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Quick Actions */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => router.push('/clients')}
                    className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-colors"
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 text-xs">Clients</div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/clients/all-locations')}
                    className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-colors"
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 text-xs">Locations</div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/contactability')}
                    className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-colors"
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 text-xs">History</div>
                    </div>
                  </button>

                  <button
                    onClick={fetchDashboardStats}
                    className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg hover:from-gray-100 hover:to-gray-200 transition-colors"
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 text-xs">Refresh</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Channel Stats Section */}
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900 mb-3">
                  Channel Statistics
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {/* Visit Card */}
                  <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-medium text-gray-600">Visits</h3>
                      <div className="p-1.5 bg-blue-100 rounded">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.Visit_Count || 0}
                    </div>
                  </div>

                  {/* Call Card */}
                  <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-medium text-gray-600">Calls</h3>
                      <div className="p-1.5 bg-green-100 rounded">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.Call_Count || 0}
                    </div>
                  </div>

                  {/* Message Card */}
                  <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-medium text-gray-600">Messages</h3>
                      <div className="p-1.5 bg-purple-100 rounded">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.Message_Count || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Result Stats Section */}
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900 mb-3">
                  Contact Result Statistics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* RPC Card */}
                  <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-medium text-gray-600">RPC</h3>
                      <div className="p-1.5 bg-red-100 rounded">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stats?.RPC_Count || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      Right Party
                    </div>
                  </div>

                  {/* TPC Card */}
                  <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-medium text-gray-600">TPC</h3>
                      <div className="p-1.5 bg-orange-100 rounded">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stats?.TPC_Count || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      Third Party
                    </div>
                  </div>

                  {/* OPC Card */}
                  <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-medium text-gray-600">OPC</h3>
                      <div className="p-1.5 bg-slate-100 rounded">
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stats?.OPC_Count || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      Other Party
                    </div>
                  </div>

                  {/* PTP Card */}
                  <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-medium text-gray-600">PTP</h3>
                      <div className="p-1.5 bg-amber-100 rounded">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stats?.PTP_Count || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      Month: {stats?.PTP_Count_This_Month || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Agent Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Name</div>
                    <div className="font-semibold text-gray-900">{user?.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-semibold text-gray-900">{user?.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Role</div>
                    <div className="font-semibold text-gray-900">{user?.role}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Team</div>
                    <div className="font-semibold text-gray-900">{user?.team}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
