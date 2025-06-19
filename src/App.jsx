import { useContext, useEffect, useState } from "react";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeContext } from "./context/ThemeContext";
import { DARK_THEME, LIGHT_THEME } from "./constants/themeConstants";
import { getMuiTheme } from "./context/muiTheme";

import "./App.scss";

// Assets
import MoonIcon from "./assets/icons/moon.svg";
import SunIcon from "./assets/icons/sun.svg";

// Layout and Providers
import BaseLayout from "./layout/BaseLayout";
import { SidebarProvider } from "./context/SidebarContext";
import { UserProvider } from "./context/UserContext";
import { ProductProvider } from "./context/ProductContext";

// Screens and Components
import { Dashboard, PageNotFound } from "./screens";
import ProductsPage from './components/productsPage/ProductsPage';
import Profile from './components/profile/Profile';
import Notifications from './components/Notifications/Notifications';
import Enquiries from './components/enquiries/Enquiries';
import Logout from './components/logout/Logout';
import Login from "./loginpage/login";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/loader/Loader";
import ProductsOverview from './components/productsoverview/ProductsOverview';
import ProductDataPage from './components/productsPage/ProductDataPage';
import AiAssistantPage from "./components/aiAssistant/AiAssistantPage";

// ✅ PWA Support
import { registerSW } from "virtual:pwa-register";

function App() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const muiTheme = getMuiTheme(theme);  // ✅ Generate theme dynamically

  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // ✅ PWA update handling
  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (window.confirm("New version available. Refresh to update?")) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log("App ready to use offline");
      },
    });
  }, []);

  // ✅ Install prompt handling
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log("Install outcome:", outcome);
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  // ✅ Sync body classes for SCSS compatibility
  useEffect(() => {
    document.body.classList.toggle("dark-mode", theme === DARK_THEME);
    document.body.classList.toggle("light-mode", theme === LIGHT_THEME);
  }, [theme]);

  // ✅ Simulated loading state
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Redirect based on homepage preference
  const HomeRedirect = () => {
    const homepagePreference = localStorage.getItem("homepagePreference") || "dashboard";
    return <Navigate to={`/${homepagePreference}`} />;
  };

  if (loading) return <Loader />;

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />

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
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/productsOverview" element={<ProtectedRoute><ProductsOverview /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
            <Route path="/products/:uid/data" element={<ProtectedRoute><ProductDataPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/ai-assistant" element={<AiAssistantPage />} />
            <Route path="/enquiries" element={<ProtectedRoute><Enquiries /></ProtectedRoute>} />
            <Route path="/logout" element={<ProtectedRoute><Logout /></ProtectedRoute>} />
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>

        {/* 🌗 Theme Toggle */}
        <button type="button" className="theme-toggle-btn" onClick={toggleTheme}>
          <img
            className="theme-icon"
            src={theme === LIGHT_THEME ? SunIcon : MoonIcon}
            alt="Toggle theme"
          />
        </button>

        {/* 📲 PWA Install Button */}
        {showInstallButton && (
          <button className="install-pwa-btn" onClick={handleInstallClick}>
            📲 Install App
          </button>
        )}
      </Router>
    </MuiThemeProvider>
  );
}

export default App;
