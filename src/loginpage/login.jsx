// src/Login.js
import React, { useState } from "react";
import Swal from "sweetalert2";
import { loginUser } from "./loginapi";
import "./login.scss";
import logo from "./image.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await loginUser(email, password);
    
    if (result.success) {
      window.location.href = "/";
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
        background: "rgba(0,0,0,0.8)", // Dark background for dark mode
        color: "#fff", // White text color
        confirmButtonColor: "#007bff", // Customize button color
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <img src={logo} alt="Company Logo" className="logo" />
            <h2>Login</h2>
            <br />
            <br />
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
              <input type="checkbox" id="rememberMe" />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <a href="#" className="forgot-password">
              Forgot your password?
            </a>
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
