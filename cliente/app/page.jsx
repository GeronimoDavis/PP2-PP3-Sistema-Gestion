"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { loginUser } from "@/api/loginApi";
import { recoverPassword } from "@/api/loginApi";
import { useRouter } from "next/navigation";
import Link from "next/link";


function Login() {
  // username y password son los estados del input de username y password
  const [username, setUsername] = useState("");
  // password es el estado del input de password
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  // login es una funcion que se ejecuta cuando se loguea el usuario
  const { login, user, token, validateToken, loading } = useAuth();
  // handleSubmit es una funcion que se ejecuta cuando se envía el formulario

  const router = useRouter(); // Usar el hook useRouter

  useEffect(() => {
    // La lógica de validación se mueve aquí dentro
    if (!loading) {
      if (token && user && validateToken(token)) {
        router.push("/dashboard");
      }
    }
  }, [token, user, validateToken, router, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      console.log("Intentando login con:", { username, password });
      // loginUser es una funcion que se encarga de hacer la peticion a la API para loguear al usuario
      // username y password son los datos del usuario que se envian al servidor
      const response = await loginUser(username, password);
      // response es el resultado de la peticion a la API
      console.log("Login exitoso:", response);

      login(response.user, response.token);

      console.log("Usuario logueado en el contexto");
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        "Error al iniciar sesión. Intente nuevamente.";
      setError(errorMessage);
      //console.error(error); // Mantenemos el log para depuración
    }
  };

  const handleRecoverPassword = async () => {
    if (!username) {
      setError("Por favor, ingresa tu nombre de usuario para recuperar la contraseña.");
      return;
    }

    try {
      await recoverPassword(username.trim());
      setError("Se ha enviado un correo para recuperar la contraseña.");
    } catch (error) {
      setError("Error al recuperar la contraseña. Intente nuevamente.");
    }
  };
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#F8F8F8",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          width: "400px",
          maxWidth: "90%",
        }}
      >
        <h2
          style={{ 
            textAlign: "center", 
            marginBottom: "0.5rem", 
            color: "#333333",
            fontSize: "24px",
            fontWeight: "700"
          }}
        >
          Sistema de Gestión
        </h2>
        <p
          style={{
            textAlign: "center",
            marginBottom: "2rem",
            color: "#666666",
            fontSize: "14px",
            fontWeight: "400"
          }}
        >
          Ingresa tus credenciales corporativas
        </p>

        {error && (
          <p
            style={{ color: "red", textAlign: "center", marginBottom: "1rem" }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#333333",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              Usuario:
            </label>
            <input
              type="text"
              placeholder="Ingresa tu nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #CCCCCC",
                borderRadius: "6px",
                fontSize: "16px",
                backgroundColor: "white",
                color: "#333333",
                outline: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                appearance: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => e.target.style.borderColor = "#007BFF"}
              onBlur={(e) => e.target.style.borderColor = "#CCCCCC"}
              required
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#333333",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              Contraseña:
            </label>
            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #CCCCCC",
                borderRadius: "6px",
                fontSize: "16px",
                backgroundColor: "white",
                color: "#333333",
                outline: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                appearance: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => e.target.style.borderColor = "#007BFF"}
              onBlur={(e) => e.target.style.borderColor = "#CCCCCC"}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px 24px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: "700",
              transition: "background-color 0.2s ease",
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#218838"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#28a745"}
          >
            Iniciar Sesión
          </button>
        </form>
        
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <button 
            type="button"
            onClick={handleRecoverPassword}
            style={{
              background: "none",
              border: "none",
              color: "#007BFF",
              fontSize: "14px",
              cursor: "pointer",
              textDecoration: "underline",
              padding: "0",
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <p style={{ 
            color: "#999999", 
            fontSize: "14px", 
            fontWeight: "400",
            marginBottom: "0.5rem"
          }}>
            ¿Necesitas ayuda?
          </p>
          <p style={{ 
            color: "#333333", 
            fontSize: "14px", 
            fontWeight: "400"
          }}>
            Contacta al administrador del sistema para solicitar acceso
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
