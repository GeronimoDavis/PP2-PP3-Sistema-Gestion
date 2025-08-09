"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { loginUser } from "@/api/loginApi";
import { useRouter } from "next/navigation";

function Login() {
  // username y password son los estados del input de username y password
  const [username, setUsername] = useState("");
  // password es el estado del input de password
  const [password, setPassword] = useState("");
  // login es una funcion que se ejecuta cuando se loguea el usuario
  const { login, user, token, validateToken } = useAuth();
  // handleSubmit es una funcion que se ejecuta cuando se envía el formulario

  const router = useRouter(); // Usar el hook useRouter

  useEffect(() => {
    // La lógica de validación se mueve aquí dentro
    if (token && user && validateToken(token)) {
      router.push("/dashboard");
    }
  }, [token, user, validateToken, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      console.error(
        "Error al intentar logearse:",
        error.response?.data || error.message
      );
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
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          width: "400px",
          maxWidth: "90%",
        }}
      >
        <h2
          style={{ textAlign: "center", marginBottom: "2rem", color: "#333" }}
        >
          Sistema de Gestión
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#333",
                fontWeight: "bold",
                fontSize: "14px",
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
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "white",
                color: "#333",
                outline: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                appearance: "none",
                boxSizing: "border-box",
              }}
              required
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#333",
                fontWeight: "bold",
                fontSize: "14px",
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
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "white",
                color: "#333",
                outline: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                appearance: "none",
                boxSizing: "border-box",
              }}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
