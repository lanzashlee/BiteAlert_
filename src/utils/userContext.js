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
      const itemCenter = item[centerField] || item.centerName;
      
      // Handle center name variations (e.g., "Balong-Bato" vs "Balong-Bato Center")
      if (itemCenter === userCenter) return true;
      if (itemCenter === userCenter + ' Center') return true;
      if (itemCenter === userCenter + ' Health Center') return true;
      if (itemCenter.replace(' Center', '') === userCenter) return true;
      if (itemCenter.replace(' Health Center', '') === userCenter) return true;
      
      return false;
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
    const newParams = { ...params, center: userCenter };
    return { url, params: newParams };
  }
  
  // If no center assigned, return empty params to show no data
  return { url, params: { ...params, center: 'none' } };
};

