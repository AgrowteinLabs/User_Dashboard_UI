import { createTheme } from "@mui/material/styles";

export const getMuiTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: "#03856d" },
      background: {
        default: mode === "dark" ? "#121212" : "#fafafa",
        paper: mode === "dark" ? "#1e1e1e" : "#ffffff",
      },
      text: {
        primary: mode === "dark" ? "#ffffff" : "#292929",
        secondary: mode === "dark" ? "#cccccc" : "#555555",
      },
    },
    typography: {
      fontFamily: "'Lato', 'Manrope', sans-serif",
    },
  });
