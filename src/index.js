import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './components/GlobalResponsive.css';
import App from './App';

// Global fetch wrapper: route relative /api/* calls to backend base URL and include credentials
const ORIGINAL_FETCH = window.fetch.bind(window);
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

window.fetch = (input, init = {}) => {
  try {
    let url;
    let options = init || {};

    if (typeof input === 'string') {
      url = input;
    } else if (input && typeof input.url === 'string') {
      url = input.url;
      // Merge Request object options if provided
      options = { method: input.method, headers: input.headers, body: input.body, ...options };
    }

    if (typeof url === 'string') {
      const isAbsolute = /^https?:\/\//i.test(url);
      if (!isAbsolute && url.startsWith('/api/')) {
        url = `${API_BASE}${url}`;
      }
    }

    const mergedOptions = {
      credentials: options.credentials ?? 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    };

    return ORIGINAL_FETCH(url ?? input, mergedOptions);
  } catch (err) {
    return ORIGINAL_FETCH(input, init);
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);