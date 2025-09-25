// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    // Auth endpoints
    login: '/api/login',
    logout: '/api/logout',
    register: '/api/register',
    
    // Patient endpoints
    patients: '/api/patients',
    bitecases: '/api/bitecases',
    
    // Center endpoints
    centers: '/api/centers',
    centerHours: '/api/center_hours',
    
    // Report endpoints
    reports: '/api/reports',
    demographic: '/api/reports/demographic',
    
    // Prescription endpoints
    prescriptions: '/api/prescriptions',
    
    // Audit trail
    auditTrail: '/api/audit-trail',
    
    // Health check
    health: '/api/health'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${apiConfig.baseURL}${endpoint}`;
};

// Helper function for fetch with base URL
export const apiFetch = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  return fetch(url, {
    credentials: options.credentials ?? 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
};
