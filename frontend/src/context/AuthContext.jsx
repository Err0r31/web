import React, { createContext, useState, useEffect } from "react";
import { getAccessToken, authLogout } from "../utils/auth.js";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getAccessToken();
    setIsAuthenticated(!!token);
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          id: decoded.user_id
        });
      } catch (err) {
        console.error("Ошибка декодирования токена:", err);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    const token = getAccessToken();
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          id: decoded.user_id
        });
      } catch (err) {
        console.error("Ошибка декодирования токена:", err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await authLogout();
      setIsAuthenticated(false);
      setUser(null);
      console.log('Выход выполнен успешно');
    } catch (err) {
      console.error("Ошибка выхода:", err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};