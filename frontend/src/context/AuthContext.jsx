import React, { createContext, useState, useEffect } from "react";
import { getAccessToken, authLogout } from "../utils/auth.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());

  useEffect(() => {
    const token = getAccessToken();
    setIsAuthenticated(!!token);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await authLogout();
      setIsAuthenticated(false);
      console.log('Выход выполнен успешно');
    } catch (err) {
      console.error("Ошибка выхода:", err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};