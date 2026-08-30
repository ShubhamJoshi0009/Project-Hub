import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContextInstance';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser({ ...response.data, token });
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    
    // Best practice: remove old, set new
    localStorage.removeItem('token');
    localStorage.setItem('token', response.data.token);
    
    // Set default header for all subsequent axios calls
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    
    setUser(response.data);
  };

  const register = async (name, email, password) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await axios.post(`${API_URL}/auth/register`, { name, email, password });
    
    localStorage.removeItem('token');
    localStorage.setItem('token', response.data.token);
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    
    setUser(response.data);
  };

  const logout = () => {
    localStorage.clear();
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (updatedData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : prev));
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) await fetchUser(token);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
