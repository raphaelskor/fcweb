'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { apiAuth } from '@/lib/api/client';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  
  const [formData, setFormData] = useState({
    email: '',
    pin: '',
  });
  const [errors, setErrors] = useState<{ email?: string; pin?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors: { email?: string; pin?: string } = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // PIN validation
    if (!formData.pin) {
      newErrors.pin = 'PIN is required';
    } else if (!/^\d{4,6}$/.test(formData.pin)) {
      newErrors.pin = 'PIN must be 4-6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For PIN, only allow numbers
    if (name === 'pin') {
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear errors when typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      const response = await apiAuth.post('/webhook/e155f504-e34f-43e7-ba3e-5fce035b27c5', {
        email: formData.email,
        pin: formData.pin,
      });

      // API returns array with user data
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const userData = response.data[0];
        
        // Save user to store
        login(userData);
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setApiError('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.status === 400 || error.response?.status === 401) {
        setApiError('Invalid email or PIN. Please try again.');
      } else if (error.code === 'ECONNABORTED') {
        setApiError('Request timeout. Please check your internet connection.');
      } else {
        setApiError('Login failed. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Field Investigator
            </h1>
            <p className="text-gray-600">
              Sign in to continue
            </p>
          </div>

          {/* Error Alert */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {apiError}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="agent@skorcard.com"
                className={`input-field ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* PIN Field */}
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                PIN
              </label>
              <input
                type="password"
                id="pin"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
                placeholder="Enter 4-6 digit PIN"
                maxLength={6}
                inputMode="numeric"
                className={`input-field ${errors.pin ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.pin && (
                <p className="mt-1 text-sm text-red-600">{errors.pin}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary w-full py-3 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Field Investigator App v1.0
          </div>
        </div>
      </div>
    </div>
  );
}
