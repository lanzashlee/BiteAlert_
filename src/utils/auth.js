export function clearAuthStorage() {
  try {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('token');
    // Clear any cached API responses
    try {
      localStorage.removeItem('apiCache');
    } catch {}
    // Set logout flag to prevent automatic redirects
    localStorage.setItem('logoutInProgress', 'true');
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
        superAdminID: user.superAdminID,
        center: user.centerName || user.center || null
      };
      try { await axioslessApiFetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); } catch {}
    }
  } catch {}
  
  // Clear all authentication data immediately and aggressively
  clearAuthStorage();
  
  // Clear any additional storage that might contain user data
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {}
  
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
  
  // Force redirect to login with multiple methods and immediate execution
  setTimeout(() => {
    try {
      // Method 1: Direct replace
      window.location.replace('/login');
    } catch (redirectError) {
      console.error('Redirect error:', redirectError);
      try {
        // Method 2: Direct href
        window.location.href = '/login';
      } catch (fallbackError) {
        console.error('Fallback redirect error:', fallbackError);
        try {
          // Method 3: Assign
          window.location.assign('/login');
        } catch (assignError) {
          console.error('Assign redirect error:', assignError);
          // Method 4: Last resort - reload to root
          window.location.reload();
        }
      }
    }
  }, 0);
}


