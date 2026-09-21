import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('user_profile', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: jwtToken, user: userProfile } = res.data.data;
      setToken(jwtToken);
      setUser(userProfile);
      localStorage.setItem('auth_token', jwtToken);
      localStorage.setItem('user_profile', JSON.stringify(userProfile));
      return userProfile;
    }
    throw new Error(res.data.message || 'Đăng nhập không thành công');
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    if (res.data.success) {
      const { token: jwtToken, user: userProfile } = res.data.data;
      setToken(jwtToken);
      setUser(userProfile);
      localStorage.setItem('auth_token', jwtToken);
      localStorage.setItem('user_profile', JSON.stringify(userProfile));
      return userProfile;
    }
    throw new Error(res.data.message || 'Đăng ký không thành công');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
