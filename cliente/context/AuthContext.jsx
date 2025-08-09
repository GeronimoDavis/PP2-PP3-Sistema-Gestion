"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // Inicializar como null
  const [loading, setLoading] = useState(true);

  const validateToken = useCallback((token) => {
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;

      // Si el token expiró o expira en menos de 1 minuto
      return payload.exp > currentTime + 60;
    } catch (error) {
      return false;
    }
  }, []);

  // Usar useEffect para acceder a localStorage después del montaje
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const user =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;

    if (token && user && validateToken(token)) {
      setToken(token);
      setUser(JSON.parse(user));
    } else {
      // Limpiar si el token es inválido
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, [validateToken]);

  const login = useCallback((userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("token", userToken);
      localStorage.setItem("user", JSON.stringify(userData));
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      validateToken,
    }),
    [user, token, loading, login, logout, validateToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
