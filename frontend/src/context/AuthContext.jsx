import React, { createContext, useState, useEffect } from "react";
import { getAccessToken, authLogout } from "../utils/auth.js";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());
  const [user, setUser] = useState(null);

  const updateUserFromToken = (token) => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("Decoded", decoded);
        setUser({
          id: decoded.user_id,
          isAdmin: decoded.is_staff || decoded.is_superuser,
        });
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Ошибка декодирования токена:", err);
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    updateUserFromToken(token);
  }, []);

  const handleLogin = (token) => {
    updateUserFromToken(token);
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