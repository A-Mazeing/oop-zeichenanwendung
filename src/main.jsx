import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { DateiManager } from './services/DateiManager.js';

// Initialize DateiManager (IndexedDB) before rendering.
// This makes getDateiManager() return a valid instance so
// BildObjekt._ladeBild() can resolve local file names.
const dateiManager = new DateiManager();
dateiManager.initialisieren().then(() => {
  console.log('DateiManager initialisiert.');
}).catch((err) => {
  console.warn('DateiManager Initialisierung fehlgeschlagen:', err);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
