// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://bitealert-backend.onrender.com';

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

// Helper function for fetch with base URL
export const apiFetch = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  return fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
};
