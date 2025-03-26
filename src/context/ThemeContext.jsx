import { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { DARK_THEME, LIGHT_THEME } from "../constants/themeConstants";

export const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  // Check the initial theme from local storage or default to LIGHT_THEME
  const [theme, setTheme] = useState(() => {
    return window.localStorage.getItem("themeMode") || LIGHT_THEME;
  });

  // Update the local storage whenever the theme changes
  useEffect(() => {
    window.localStorage.setItem("themeMode", theme);
  }, [theme]); // runs when theme changes

  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME
    );
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
