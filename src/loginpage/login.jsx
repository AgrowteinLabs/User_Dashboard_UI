import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";  // Import useNavigate
import { loginUser } from "./loginapi";
import "./login.scss";
import logo from "./Logow.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize navigate hook
  const navigate = useNavigate();

  // Check if user is already remembered and log them in automatically
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    if (savedEmail) {
      setEmail(savedEmail);
    }

    // Check if the user is authenticated, otherwise redirect to /login
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await loginUser(email, password);

    if (result.success) {
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      // Set authentication flag to true
      localStorage.setItem("isAuthenticated", "true");
      navigate("/");  // Use navigate to redirect to homepage after login
    } else {
      Swal.fire({
        icon: "error",
        title: "Login failed",
        text: result.message,
        confirmButtonText: "OK",
        customClass: {
          container: "swal-container",
          title: "swal-title",
          content: "swal-content",
          confirmButton: "swal-confirm-button",
        },
        backdrop: true,
        background: "rgba(0,0,0,0.8)",
        color: "#fff",
        confirmButtonColor: "#007bff",
      });
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode");
  };

  return (
    <div className={`login-page ${darkMode ? "dark-mode" : ""}`}>
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <img src={logo} alt="Company Logo" className="logo" />
            <h2>Login</h2>
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
            <div className="login-input">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            <button type="button" onClick={toggleDarkMode}>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <br />
            <button type="submit" className="login-button">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
