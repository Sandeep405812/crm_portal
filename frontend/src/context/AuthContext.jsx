import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/services';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('crm_portal_user') || localStorage.getItem('mini_erp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(
    () => localStorage.getItem('crm_portal_token') || localStorage.getItem('mini_erp_token') || null
  );
  const [loading, setLoading] = useState(true);

  const logout = React.useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('crm_portal_token');
    localStorage.removeItem('crm_portal_user');
    localStorage.removeItem('mini_erp_token');
    localStorage.removeItem('mini_erp_user');
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.data?.success) {
            setUser(res.data.data.user);
            localStorage.setItem('crm_portal_user', JSON.stringify(res.data.data.user));
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token, logout]);

  const login = async (email, password) => {
    try {
      const res = await authService.login({ email, password });
      if (res.data?.success) {
        const { token: jwtToken, user: userData } = res.data.data;
        setToken(jwtToken);
        setUser(userData);
        localStorage.setItem('crm_portal_token', jwtToken);
        localStorage.setItem('crm_portal_user', JSON.stringify(userData));
        toast.success(`Welcome back, ${userData.name}!`);
        return true;
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(msg);
      return false;
    }
  };

  const register = async ({ name, email, password, role }) => {
    try {
      const res = await authService.register({ name, email, password, role });
      if (res.data?.success) {
        const { token: jwtToken, user: userData } = res.data.data;
        setToken(jwtToken);
        setUser(userData);
        localStorage.setItem('crm_portal_token', jwtToken);
        localStorage.setItem('crm_portal_user', JSON.stringify(userData));
        toast.success(`Account created successfully! Welcome, ${userData.name}!`);
        return true;
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed.';
      toast.error(msg);
      return false;
    }
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
