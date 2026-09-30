import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const PRELOAD_RELOAD_KEY = 'veridia_last_preload_reload';
const PRELOAD_RELOAD_WINDOW_MS = 30000;

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  try {
    const lastReload = sessionStorage.getItem(PRELOAD_RELOAD_KEY);
    const now = Date.now();
    if (lastReload && now - Number(lastReload) < PRELOAD_RELOAD_WINDOW_MS) {
      return;
    }
    sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(now));
  } catch {
    // sessionStorage inacessivel em navegacao restrita
  }
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
