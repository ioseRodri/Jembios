
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { postJson } from "../services/http";
import "../styles/auth.css";
import { useUser } from "../store/user.jsx";

export default function Login() {
  
  const { usuario, login } = useUser();

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "nombre") setNombre(value);
    if (name === "correo") setCorreo(value);
    if (name === "password") setPassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      const url = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { correo, password }
        : { nombre, correo, password, rol: "Cliente" };

      const data = await postJson(url, payload);
      const user = data.usuario || data; 

      
      login(user);

      
      if (user.rol === "Cliente") {
        const savedCart = JSON.parse(localStorage.getItem(`cart_${user.id}`) || "[]");
        localStorage.setItem("cart", JSON.stringify(savedCart));
      }

      setMensaje("✅ Inicio de sesión exitoso");
      setTimeout(() => {
        if (user.rol === "Administrador") navigate("/admin");
        else if (user.rol === "Marketing") navigate("/marketing");
        else navigate("/productos");
      }, 300);
    } catch (error) {
      setMensaje(
        error?.response?.data?.error ||
        error?.message ||
        "❌ Error en la conexión o datos incorrectos"
      );
    }
  };

  useEffect(() => {
    if (usuario) {
      if (usuario.rol === "Administrador") navigate("/admin");
      else if (usuario.rol === "Marketing") navigate("/marketing");
      else navigate("/productos");
    }
  }, [usuario, navigate]);

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-form">
          <h2 className="auth-title">{isLogin ? "Iniciar sesión" : "Registrarse"}</h2>
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="auth-label">Nombre Completo:</label>
                <input
                  className="auth-input"
                  type="text"
                  name="nombre"
                  value={nombre}
                  onChange={handleInputChange}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
            )}

            <div>
              <label className="auth-label">Correo electrónico:</label>
              <input
                className="auth-input"
                type="email"
                name="correo"
                value={correo}
                onChange={handleInputChange}
                placeholder="Ej: usuario@gmail.com"
                required
              />
            </div>

            <div>
              <label className="auth-label">Contraseña:</label>
              <input
                className="auth-input"
                type="password"
                name="password"
                value={password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="auth-btn">
              {isLogin ? "Iniciar sesión" : "Registrar"}
            </button>
          </form>

          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setMensaje("");
              setNombre("");
              setCorreo("");
              setPassword("");
            }}
            className="auth-switch"
          >
            {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>

          {mensaje && <div className="auth-msg">{mensaje}</div>}
        </div>

        <div className="auth-hero">
          <h2>¡Bienvenido a Jembios!</h2>
          <p>Tu farmacia digital de confianza 💊. Encuentra tus productos médicos y controla tus pedidos fácilmente.</p>
        </div>
      </div>
    </div>
  );
}
