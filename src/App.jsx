import { useContext, useEffect, useState } from "react";
import "./App.scss";
import { ThemeContext } from "./context/ThemeContext";
import { DARK_THEME, LIGHT_THEME } from "./constants/themeConstants";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MoonIcon from "./assets/icons/moon.svg";
import SunIcon from "./assets/icons/sun.svg";
import BaseLayout from "./layout/BaseLayout";
import { Dashboard, PageNotFound } from "./screens";
import Products from './components/products/Products';
import Profile from './components/profile/Profile';
import Notifications from './components/Notifications/Notifications';
import Enquiries from './components/enquiries/Enquiries';
import Logout from './components/logout/Logout';
import { SidebarProvider } from './context/SidebarContext';
import { UserProvider } from "./context/UserContext";
import { ProductProvider } from "./context/ProductContext";
import Login from "./loginpage/login";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/loader/Loader";

// ✅ PWA: Import Service Worker register
import { registerSW } from "virtual:pwa-register";

function App() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);

  // ✅ PWA: Register and handle update
  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (window.confirm("New update available. Refresh to update?")) {
          updateSW(true); // force update
        }
      },
      onOfflineReady() {
        console.log("App is ready to work offline.");
      },
    });
  }, []);

  // Apply theme classes
  useEffect(() => {
    if (theme === DARK_THEME) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <SidebarProvider>
              <UserProvider>
                <ProductProvider>
                  <BaseLayout />
                </ProductProvider>
              </UserProvider>
            </SidebarProvider>
          }
        >
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/enquiries" element={<ProtectedRoute><Enquiries /></ProtectedRoute>} />
          <Route path="/logout" element={<ProtectedRoute><Logout /></ProtectedRoute>} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>

      {/* Theme Toggle Button */}
      <button
        type="button"
        className="theme-toggle-btn"
        onClick={toggleTheme}
      >
        <img
          className="theme-icon"
          src={theme === LIGHT_THEME ? SunIcon : MoonIcon}
          alt="Toggle theme"
        />
      </button>
    </Router>
  );
}

export default App;
