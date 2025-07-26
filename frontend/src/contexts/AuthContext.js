import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Try to decode token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          email: payload.sub,
          role: payload.role,
          id: payload.user_id
        });
      } catch (error) {
        console.error('Invalid token:', error);
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8000/auth/login', { email, password });
      const { access_token, role } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser({ email, role });
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isViewer = () => {
    return user?.role === 'viewer';
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin,
    isViewer
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 