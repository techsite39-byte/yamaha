import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { replaceYamahaMotorcycles } from './components/Yamaha/yamahaMotorcycles.js';
import { buildApiUrl } from './config/api.js';
import './styles.css';

async function loadPublicMotorcycles() {
  try {
    const response = await fetch(buildApiUrl('/api/public/motorcycles'), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`);
    const result = await response.json();
    replaceYamahaMotorcycles(result.motorcycles);
  } catch (error) {
    console.warn('Using the bundled motorcycle catalog because the server catalog is unavailable.', error);
  }
}

loadPublicMotorcycles().finally(() => {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
