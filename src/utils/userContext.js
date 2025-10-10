// Utility functions for user context and role-based access

export const getUserCenter = () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || 
                       JSON.parse(localStorage.getItem('userData'));
    
    console.log('🔍 getUserCenter DEBUG:');
    console.log('Current user:', currentUser);
    console.log('User role:', currentUser?.role);
    console.log('User centerName:', currentUser?.centerName);
    
    if (!currentUser) {
      console.log('No current user found');
      return null;
    }
    
    // Super admins have access to all centers
    if (currentUser.role === 'superadmin') {
      console.log('User is superadmin, returning "all"');
      return 'all';
    }
    
    // Regular admins are restricted to their assigned center
    // Fallback across multiple possible fields to avoid missing scoping
    const fallbackFields = [
      currentUser.centerName,
      currentUser.center,
      currentUser.barangay,
      currentUser.barangayName,
      currentUser.healthCenter,
      currentUser.facility,
      currentUser.treatmentCenter,
      currentUser.center_name,
      currentUser.assignedCenter
    ];
    const center = fallbackFields.find(v => typeof v === 'string' && v.trim().length > 0) || null;
    console.log('Returning center for admin:', center);
    return center;
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
      const itemCenter = item[centerField] || item.centerName || item.healthCenter || item.facility || item.treatmentCenter || item.center || '';
      const itemBarangay = item.barangay || item.addressBarangay || item.patientBarangay || item.locationBarangay || item.barangayName || item.centerBarangay || '';
      
      // Handle center name variations (e.g., "Balong-Bato" vs "Balong-Bato Center")
      const norm = (v) => String(v||'').toLowerCase().replace(/\s*health\s*center$/,'').replace(/\s*center$/,'').trim();
      const centerMatch = norm(itemCenter) === norm(userCenter) || norm(userCenter).includes(norm(itemCenter)) || norm(itemCenter).includes(norm(userCenter));
      
      // Handle barangay matching
      const barangayMatch = norm(itemBarangay) === norm(userCenter) || norm(itemBarangay).includes(norm(userCenter)) || norm(userCenter).includes(norm(itemBarangay));
      
      return centerMatch || barangayMatch;
    });
  }
  
  // If no center assigned, return empty array
  return [];
};

// Strict barangay-based filter for Admin role
export const filterByAdminBarangay = (data, centerField = 'center') => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || 
                      JSON.parse(localStorage.getItem('userData'));
  const role = currentUser?.role;
  const userCenter = currentUser?.centerName || currentUser?.center || currentUser?.barangay || currentUser?.barangayName || currentUser?.healthCenter || '';

  // Superadmin or missing user -> return as-is
  if (!currentUser || role === 'superadmin') return data;

  const norm = (v) => String(v || '')
    .toLowerCase()
    .replace(/\s*health\s*center$/,'')
    .replace(/\s*center$/,'')
    .trim();

  const target = norm(userCenter);

  return (data || []).filter(item => {
    const itemCenter = item[centerField] || item.centerName || item.center || item.healthCenter || item.facility || item.treatmentCenter || '';
    const itemBarangay = item.barangay || item.addressBarangay || item.patientBarangay || item.locationBarangay || item.barangayName || item.centerBarangay || '';

    const nCenter = norm(itemCenter);
    const nBarangay = norm(itemBarangay);

    // Prefer strict match; fall back to includes only if needed
    const strictMatch = nBarangay === target || nCenter === target;
    if (strictMatch) return true;
    return nBarangay && (nBarangay.includes(target) || target.includes(nBarangay))
        || nCenter && (nCenter.includes(target) || target.includes(nCenter));
  });
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

