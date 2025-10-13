import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './components/GlobalResponsive.css';
import App from './App';

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