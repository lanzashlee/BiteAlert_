import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './components/GlobalResponsive.css';
import App from './App';

// Non-blocking stale state cleanup in dev
if (process.env.NODE_ENV !== 'production' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  setTimeout(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (error) {
      console.warn('Failed to clear stale state:', error);
    }
  }, 100);
}

// Install chunk recovery with self-resetting flag
if (process.env.NODE_ENV !== 'production' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  let chunkRecoveryAttempts = 0;
  const shouldRecover = (message) => /ChunkLoadError|Loading chunk|Unexpected token '<'/i.test(String(message || ''));
  
  window.addEventListener('error', (event) => {
    const message = event?.error?.message || event?.message || '';
    if (shouldRecover(message) && chunkRecoveryAttempts === 0) {
      chunkRecoveryAttempts++;
      setTimeout(() => window.location.reload(), 500);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = event?.reason?.message || event?.reason || '';
    if (shouldRecover(message) && chunkRecoveryAttempts === 0) {
      chunkRecoveryAttempts++;
      setTimeout(() => window.location.reload(), 500);
    }
  });
}

const rootEl = document.getElementById('root');
const root = ReactDOM.createRoot(rootEl);

// Add a class once the app mounts to stabilize layout (prevents initial jank)
function onAppReady() {
  document.documentElement.classList.add('app-ready');
}

root.render(
  <React.StrictMode>
    <App onReady={onAppReady} />
  </React.StrictMode>
);