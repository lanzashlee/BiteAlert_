// Utility functions for user context and role-based access

export const getUserCenter = () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || 
                       JSON.parse(localStorage.getItem('userData'));
    
    if (!currentUser) return null;
    
    // Super admins have access to all centers
    if (currentUser.role === 'superadmin') {
      return 'all';
    }
    
    // Regular admins are restricted to their assigned center
    return currentUser.centerName || null;
  } catch (error) {
    console.error('Error getting user center:', error);
    return null;
  }
};

export const getUserRole = () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || 
                       JSON.parse(localStorage.getItem('userData'));
    
    return currentUser?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

export const isSuperAdmin = () => {
  return getUserRole() === 'superadmin';
};

export const isAdmin = () => {
  return getUserRole() === 'admin';
};

export const canAccessAllCenters = () => {
  return isSuperAdmin();
};

export const getCenterFilter = () => {
  const userCenter = getUserCenter();
  return userCenter === 'all' ? null : userCenter;
};

// Helper function to filter data by center
export const filterByCenter = (data, centerField = 'center') => {
  const userCenter = getUserCenter();
  
  // Super admins see all data
  if (userCenter === 'all') {
    return data;
  }
  
  // Regular admins only see their center's data
  if (userCenter) {
    return data.filter(item => {
      const itemCenter = item[centerField] || item.centerName || item.healthCenter || item.facility || item.treatmentCenter || '';
      const itemBarangay = item.barangay || item.addressBarangay || item.patientBarangay || item.locationBarangay || item.barangayName || '';
      
      // Handle center name variations (e.g., "Balong-Bato" vs "Balong-Bato Center")
      const centerMatch = itemCenter === userCenter || 
                         itemCenter === userCenter + ' Center' || 
                         itemCenter === userCenter + ' Health Center' ||
                         itemCenter.replace(' Center', '') === userCenter ||
                         itemCenter.replace(' Health Center', '') === userCenter ||
                         itemCenter.toLowerCase().includes(userCenter.toLowerCase()) ||
                         userCenter.toLowerCase().includes(itemCenter.toLowerCase());
      
      // Handle barangay matching
      const barangayMatch = itemBarangay === userCenter ||
                           itemBarangay.toLowerCase().includes(userCenter.toLowerCase()) ||
                           userCenter.toLowerCase().includes(itemBarangay.toLowerCase());
      
      return centerMatch || barangayMatch;
    });
  }
  
  // If no center assigned, return empty array
  return [];
};

// Helper function to add center filter to API requests
export const addCenterFilterToRequest = (url, params = {}) => {
  const userCenter = getUserCenter();
  
  // Super admins don't need center filtering
  if (userCenter === 'all') {
    return { url, params };
  }
  
  // Regular admins need center filtering
  if (userCenter) {
    const newParams = { ...params, center: userCenter, barangay: userCenter };
    return { url, params: newParams };
  }
  
  // If no center assigned, return empty params to show no data
  return { url, params: { ...params, center: 'none' } };
};

