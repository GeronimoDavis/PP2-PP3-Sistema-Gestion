import { createContext, useContext, useState } from 'react';

// Contexto de autenticación para compartir el estado de autenticación entre componentes 
// useAuth es un hook personalizado para acceder al contexto de autenticación
const AuthContext = createContext();
// useAuth es un hook personalizado para acceder al contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// AuthProvider es un componente que proporciona el contexto de autenticación a sus componentes hijos
// user es el estado del usuario autenticado
// token es el token de autenticación
// login es una función para iniciar sesión
// logout es una función para cerrar sesión
// authContext es el contexto de autenticación
// useAuth es un hook personalizado para acceder al contexto de autenticación
// AuthProvider es un componente que proporciona el contexto de autenticación a sus componentes hijos
// user es el estado del usuario autenticado
// token es el token de autenticación
// login es una función para iniciar sesión
// logout es una función para cerrar sesión
// children es el contenido que se renderiza dentro del AuthProvider


export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login =(userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{user, token, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};


        