// API Configuration - Updated for Render deployment
// Force redeploy to pick up environment variables
// Use the backend URL from render.yaml configuration

// Import caching utilities
import { getCachedData, setCachedData } from '../utils/apiCache';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://bitealert-backend-9rv9.onrender.com';

// Debug: Log the API base URL to console
console.log('API Base URL:', API_BASE_URL);

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
    prescriptiveAnalytics: '/api/prescriptive-analytics',
    
    // Audit trail
    auditTrail: '/api/audit-trail',
    
    // Health check
    health: '/api/health',
    
    // Admin endpoints
    adminAccounts: '/api/admin-accounts',
    updateAccountStatus: '/api/update-account-status',
    accountStatus: '/api/account-status',
    
    // Patient management endpoints
    getPatientPassword: '/api/get-patient-password',
    changePatientPassword: '/api/change-patient-password',
    
    // Admin management endpoints
    getAdminPassword: '/api/get-admin-password',
    changeAdminPassword: '/api/change-admin-password',
    
    // Vaccination endpoints
    vaccinationData: '/api/vaccination-data',
    vaccinationDates: '/api/vaccinationdates',
    vaccinations: '/api/vaccinations',
    
    // Dashboard endpoints
    dashboardSummary: '/api/dashboard-summary',
    casesPerBarangay: '/api/cases-per-barangay',
    patientGrowth: '/api/patient-growth',
    vaccineStockTrends: '/api/vaccine-stock-trends',
    severityDistribution: '/api/severity-distribution',
    
    // Staff endpoints
    staffs: '/api/staffs',
    
    // Inventory endpoints
    vaccinestocks: '/api/vaccinestocks',
    
    // Report endpoints
    rabiesUtilization: '/api/reports/rabies-utilization',
    animalBiteExposure: '/api/reports/animal-bite-exposure',
    
    // Notifications
    notifications: '/api/notifications',
    
    // Profile picture
    profilePicture: '/api/profile-picture'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${apiConfig.baseURL}${endpoint}`;
};

// Helper function for fetch with base URL and caching
export const apiFetch = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);

  // Scope cache by user role/center so admins don't see superadmin cached data
  let cacheKey = url;
  try {
    const user = JSON.parse(localStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('userData')) || {};
    const role = user.role || 'guest';
    const center = user.centerName || 'all';
    cacheKey = `${url}::${role}::${center}`;
  } catch (_) {}
  
  // Check cache for GET requests
  if (!options.method || options.method === 'GET') {
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log('Using cached data for:', url);
      return {
        ok: true,
        json: () => Promise.resolve(cachedData),
        status: 200,
        headers: new Headers()
      };
    }
  }
  
  // Add timeout for faster failure detection
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for Render cold starts
  
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });
    
    clearTimeout(timeoutId);
    
    // Cache successful GET responses
    if (response.ok && (!options.method || options.method === 'GET')) {
      try {
        const data = await response.clone().json();
        setCachedData(cacheKey, data);
      } catch (error) {
        console.warn('Failed to cache response:', error);
      }
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - the server is taking too long to respond. Please try again.');
    }
    throw error;
  }
};
