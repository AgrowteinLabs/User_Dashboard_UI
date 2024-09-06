import { useContext, useEffect } from "react";
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
import { ProductProvider } from "./context/ProductContext";  // Import ProductProvider
import Login from "./loginpage/login";
import ProtectedRoute from "./components/ProtectedRoute";  // Import ProtectedRoute

function App() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  // Apply dark or light theme based on the selected theme in the context
  useEffect(() => {
    if (theme === DARK_THEME) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [theme]);

  return (
    <Router>
      <Routes>
        {/* Route for Login without wrapping with providers */}
        <Route path="/login" element={<Login />} />

        {/* Main application routes with Sidebar, User, and Product context providers */}
        <Route
          element={
            <SidebarProvider>
              <UserProvider>
                <ProductProvider> {/* Wrapping inside ProductProvider */}
                  <BaseLayout />
                </ProductProvider>
              </UserProvider>
            </SidebarProvider>
          }
        >
          {/* Dashboard Route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Products Route */}
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />

          {/* Profile Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Notifications Route */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* Enquiries Route */}
          <Route
            path="/enquiries"
            element={
              <ProtectedRoute>
                <Enquiries />
              </ProtectedRoute>
            }
          />

          {/* Logout Route */}
          <Route
            path="/logout"
            element={
              <ProtectedRoute>
                <Logout />
              </ProtectedRoute>
            }
          />

          {/* 404 - Page Not Found Route */}
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
