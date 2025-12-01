import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedUserType = localStorage.getItem('userType');

    if (storedToken && storedUser && storedUserType) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setUserType(storedUserType);
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken, type) => {
    setUser(userData);
    setToken(authToken);
    setUserType(type);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userType', type);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUserType(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
  };

  const value = {
    user,
    token,
    userType,
    loading,
    login,
    logout,
    isAuthenticated: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};