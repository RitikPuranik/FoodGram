import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('foodgram_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [role, setRole] = useState(() => {
    return localStorage.getItem('foodgram_role') || null;
  });
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      localStorage.setItem('foodgram_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('foodgram_user');
    }
  }, [user]);

  useEffect(() => {
    if (role) {
      localStorage.setItem('foodgram_role', role);
    } else {
      localStorage.removeItem('foodgram_role');
    }
  }, [role]);

  const loginAsUser = async (credentials) => {
    setLoading(true);
    try {
      const res = await authApi.loginUser(credentials);
      setUser(res.data.user);
      setRole('user');
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const registerAsUser = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.registerUser(data);
      setUser(res.data.user);
      setRole('user');
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const loginAsPartner = async (credentials) => {
    setLoading(true);
    try {
      const res = await authApi.loginFoodPartner(credentials);
      setUser(res.data.foodPartner);
      setRole('partner');
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const registerAsPartner = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.registerFoodPartner(data);
      setUser(res.data.foodPartner);
      setRole('partner');
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (role === 'partner') {
        await authApi.logoutFoodPartner();
      } else {
        await authApi.logoutUser();
      }
    } catch (e) {
      // ignore
    }
    setUser(null);
    setRole(null);
    localStorage.removeItem('foodgram_user');
    localStorage.removeItem('foodgram_role');
  };

  // Called after a successful profile update to keep user state in sync
  const updateUserProfile = (updatedFields) => {
    setUser(prev => ({ ...prev, ...updatedFields }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        loading,
        loginAsUser,
        registerAsUser,
        loginAsPartner,
        registerAsPartner,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
