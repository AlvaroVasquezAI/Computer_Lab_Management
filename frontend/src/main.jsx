import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './i18n/config.js';

import './styles/main.css';
import './styles/themes.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Suspense fallback="loading...">
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </Suspense>
);