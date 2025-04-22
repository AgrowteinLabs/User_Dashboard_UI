import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/loginapi";
import "./login.scss";
import logo from "./Logow.png";

// Font Awesome Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // Load remembered email if it exists
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await loginUser(email, password);

    if (result.success) {
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Set auth flag
      localStorage.setItem("isAuthenticated", "true");

      // ✅ Redirect to dashboard and replace login page in history
      navigate("/", { replace: true });
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

  return (
    <div className="login-page">
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
