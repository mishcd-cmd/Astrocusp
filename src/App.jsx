import React from 'react';

export default function App() {
  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem',
      lineHeight: 1.4
    }}>
      <h1>✨ Astrocusp</h1>
      <p>If you can see this, the React app is mounted and ES modules are working.</p>

      <pre style={{
        background: '#111',
        color: '#0f0',
        padding: '1rem',
        borderRadius: '8px',
        overflowX: 'auto'
      }}>
{JSON.stringify({
  mode: (import.meta?.env && import.meta.env.MODE) || 'unknown',
  base:  (import.meta?.env && import.meta.env.BASE_URL) || 'unknown',
  isModule: typeof import.meta
}, null, 2)}
      </pre>

      <p>
        If you still get “Cannot use <code>import.meta</code> outside a module”, it means the
        <code>&lt;script type="module" src="/src/main.jsx"&gt;</code> is not being served or the path is wrong.
      </p>
    </div>
  );
}
