import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); 

  const login = (token) => {
    setAuthToken(token);
    const decodedToken = jwtDecode(token);
    setUser({ email: decodedToken.sub, role: decodedToken.role, name: decodedToken.name }); 
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
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
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};