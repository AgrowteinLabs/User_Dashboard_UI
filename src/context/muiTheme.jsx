import { createTheme } from "@mui/material/styles";

export const getMuiTheme = (mode) => {
  const safeMode = mode === "dark" ? "dark" : "light"; // fallback safety
  return createTheme({
    palette: {
      mode: safeMode,
      primary: { main: "#03856d" },
      background: {
        default: safeMode === "dark" ? "#121212" : "#fafafa",
        paper: safeMode === "dark" ? "#1e1e1e" : "#ffffff",
      },
      text: {
        primary: safeMode === "dark" ? "#ffffff" : "#292929",
        secondary: safeMode === "dark" ? "#cccccc" : "#555555",
      },
    },
    typography: {
      fontFamily: "'Lato', 'Manrope', sans-serif",
    },
  });
};
