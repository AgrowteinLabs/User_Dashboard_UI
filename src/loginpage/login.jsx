// src/loginpage/Login.jsx
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/loginapi";
import "./login.scss";
import logo from "./Logow.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    if (savedEmail) setEmail(savedEmail);
    if (isAuthenticated && localStorage.getItem("userId")) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await loginUser(email, password);

    if (result.success && result.userId) {
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userId", result.userId);
      localStorage.setItem("token", result.token);

      navigate("/");
    } else {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: result.message || "Something went wrong. Try again.",
        background: "#1e1e1e",
        color: "#fff",
        confirmButtonColor: "#03856d",
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <img src={logo} alt="Agrowtrack Logo" className="logo" />
            <h2>Welcome Back</h2>
          </div>
          <form onSubmit={handleLogin}>
            <div className="login-input">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="login-input password-input">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
            <div className="login-remember">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <button type="submit" className="login-button">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
