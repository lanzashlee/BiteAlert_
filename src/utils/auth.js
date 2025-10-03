export function clearAuthStorage() {
  try {
    // Import security utilities
    const { secureStorage, logSecurityEvent } = require('./security');
    
    // Get user info before clearing for logging
    const raw = localStorage.getItem('currentUser') || localStorage.getItem('userData');
    const user = raw ? JSON.parse(raw) : null;
    
    // Clear all storage using secure methods
    secureStorage.removeItem('currentUser');
    secureStorage.removeItem('userData');
    secureStorage.removeItem('token');
    secureStorage.removeItem('rememberMe');
    secureStorage.removeItem('apiCache');
    
    // Clear session storage
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('token');
    
    // Log security event
    if (user) {
      logSecurityEvent('LOGOUT_SUCCESS', { userId: user.id, role: user.role });
    }
  } catch {}
}

export async function fullLogout(axioslessApiFetch) {
  try {
    const raw = localStorage.getItem('currentUser') || localStorage.getItem('userData');
    const user = raw ? JSON.parse(raw) : null;
    if (user && axioslessApiFetch) {
      const payload = {
        role: user.role,
        firstName: user.firstName,
        middleName: user.middleName || '',
        lastName: user.lastName,
        action: 'Signed out',
        adminID: user.adminID,
        superAdminID: user.superAdminID
      };
      try { await axioslessApiFetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); } catch {}
    }
  } catch {}
  clearAuthStorage();
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch {}
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  } catch {}
  window.location.replace('/login');
}


