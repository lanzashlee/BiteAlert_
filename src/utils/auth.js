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


