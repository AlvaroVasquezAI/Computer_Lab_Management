import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        
        if (decodedToken.exp * 1000 > Date.now()) {
          setAuthToken(token);
          setUser({ email: decodedToken.sub, role: decodedToken.role, name: decodedToken.name });
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error("Invalid token found in localStorage", error);
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  }, []); 

  const login = (token) => {
    setAuthToken(token);
    const decodedToken = jwtDecode(token);
    setUser({ email: decodedToken.sub, role: decodedToken.role, name: decodedToken.name }); 
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('authToken', token); 
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
    localStorage.removeItem('authToken'); 
  };

  const authContextValue = {
    authToken,
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};