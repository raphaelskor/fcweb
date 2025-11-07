import axios from 'axios';

const API_BASE_URL = 'https://n8n-sit.skorcard.app';
const API_AUTH_URL = 'https://n8n.skorcard.app';
const API_PHOTO_URL = 'https://n8n.skorcard.app';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

export const apiAuth = axios.create({
  baseURL: API_AUTH_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

export const apiPhoto = axios.create({
  baseURL: API_PHOTO_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - NO AUTO LOGOUT
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Don't auto logout - let user logout manually only
    return Promise.reject(error);
  }
);

// Add same interceptors to other clients - NO AUTO LOGOUT
apiAuth.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto logout - let user logout manually only
    return Promise.reject(error);
  }
);

apiPhoto.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto logout - let user logout manually only
    return Promise.reject(error);
  }
);

export default apiClient;
