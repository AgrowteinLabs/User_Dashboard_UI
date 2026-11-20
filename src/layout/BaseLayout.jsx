import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components";
import PushInit from "../components/PushInit";
import { ThemeContext } from "../context/ThemeContext";
import { LIGHT_THEME } from "../constants/themeConstants";
import MoonIcon from "../assets/icons/moon.svg";
import SunIcon from "../assets/icons/sun.svg";

const BaseLayout = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <main className="page-wrapper">
      {/* left of page */}
      <Sidebar />
      
      {/* right side/content of the page */}
      <div className="content-wrapper">
        <PushInit />
        <Outlet />
      </div>

      {/* Floating theme toggle (docked at the top-right edge) */}
      <button type="button" className="theme-toggle-btn" onClick={toggleTheme}>
        <img
          className="theme-icon"
          src={theme === LIGHT_THEME ? SunIcon : MoonIcon}
          alt="Toggle theme"
        />
      </button>
    </main>
  );
};

export default BaseLayout;
