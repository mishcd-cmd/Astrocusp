import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Quick sanity log to prove this file *is* running as an ES module
console.log('[main] typeof import.meta =', typeof import.meta);
console.log('[main] import.meta.env?.MODE =', import.meta?.env?.MODE);

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
