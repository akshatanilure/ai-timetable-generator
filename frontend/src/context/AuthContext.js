import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          const userObj = userData.data;
          setUser(userObj);
          setRole(userObj.role);
          localStorage.setItem('role', userObj.role);
        } catch (err) {
          authService.logout();
          setRole(null);
          localStorage.removeItem('role');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const resData = await authService.login(email, password);
    const userObj = {
      _id: resData._id,
      name: resData.name,
      email: resData.email,
      role: resData.role,
      department: resData.department,
      semester: resData.semester,
      division: resData.division,
    };
    setUser(userObj);
    setRole(userObj.role);
    localStorage.setItem('role', userObj.role);
    return resData;
  };

  const register = async (userData) => {
    const resData = await authService.register(userData);
    const userObj = {
      _id: resData._id,
      name: resData.name,
      email: resData.email,
      role: resData.role,
      department: resData.department,
      semester: resData.semester,
      division: resData.division,
    };
    setUser(userObj);
    setRole(userObj.role);
    localStorage.setItem('role', userObj.role);
    return resData;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setRole(null);
    localStorage.removeItem('role');
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
