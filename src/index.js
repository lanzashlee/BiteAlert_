import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './components/GlobalResponsive.css';
import './utils/consoleSecurity'; // Import console security
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);