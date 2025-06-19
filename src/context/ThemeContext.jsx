import { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { DARK_THEME, LIGHT_THEME } from "../constants/themeConstants";

export const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("themeMode") || LIGHT_THEME;
    }
    return LIGHT_THEME; // fallback for SSR
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("themeMode", theme);
      document.body.classList.toggle("dark-mode", theme === DARK_THEME);
      document.body.classList.toggle("light-mode", theme === LIGHT_THEME);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};


ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
