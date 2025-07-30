import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// i18n configuration
import './i18n/config.js';

// Global Styles
import './styles/main.css';
import './styles/themes.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback="loading...">
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </Suspense>
  </React.StrictMode>
);