import { createTheme } from "@mui/material/styles";

export const getMuiTheme = (mode) => {
  const safeMode = mode === "dark" ? "dark" : "light"; // fallback safety
  
  // Custom colors matching our App.scss variables
  const primaryColor = "#00b890";
  const cyanColor = "#00e5ff";
  
  const bgDefault = safeMode === "dark" ? "#080f1e" : "#f8fafc";
  const bgPaper = safeMode === "dark" ? "rgba(15, 23, 42, 0.65)" : "rgba(255, 255, 255, 0.75)";
  const borderColor = safeMode === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(226, 232, 240, 0.8)";
  const textPrimary = safeMode === "dark" ? "#f8fafc" : "#0f172a";
  const textSecondary = safeMode === "dark" ? "#94a3b8" : "#475569";
  
  return createTheme({
    palette: {
      mode: safeMode,
      primary: {
        main: primaryColor,
        dark: "#009e7c",
        light: "#33c6a6",
        contrastText: "#ffffff",
      },
      secondary: {
        main: safeMode === "dark" ? cyanColor : "#00d2d3",
      },
      background: {
        default: bgDefault,
        paper: bgPaper,
      },
      text: {
        primary: textPrimary,
        secondary: textSecondary,
      },
      divider: borderColor,
    },
    typography: {
      fontFamily: "'Manrope', 'Lato', sans-serif",
      h1: { fontWeight: 800 },
      h2: { fontWeight: 800 },
      h3: { fontWeight: 800 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      body1: { fontFamily: "'Lato', sans-serif" },
      body2: { fontFamily: "'Lato', sans-serif" },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: safeMode === "dark" ? "#1e293b #0b1528" : "#cbd5e1 #ffffff",
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: safeMode === "dark" ? "#0b1528" : "#ffffff",
            },
            "&::-webkit-scrollbar-thumb": {
              background: safeMode === "dark" ? "#1e293b" : "#cbd5e1",
              borderRadius: "4px",
              "&:hover": {
                background: primaryColor,
              },
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: bgPaper,
            backdropFilter: safeMode === "dark" ? "blur(16px)" : "blur(12px)",
            border: `1px solid ${borderColor}`,
            borderRadius: "18px",
            boxShadow: safeMode === "dark" 
              ? "0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)" 
              : "0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "30px",
            padding: "8px 20px",
            transition: "all 0.2s ease-out",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(0, 184, 144, 0.2)",
            },
            "&:active": {
              transform: "translateY(0)",
            },
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${primaryColor} 0%, #02856d 100%)`,
            boxShadow: "0 4px 14px rgba(0, 184, 144, 0.25)",
            "&:hover": {
              background: `linear-gradient(135deg, #00d2d3 0%, ${primaryColor} 100%)`,
              boxShadow: "0 6px 20px rgba(0, 184, 144, 0.35)",
            },
          },
          outlinedPrimary: {
            borderWidth: "1.5px",
            borderColor: primaryColor,
            "&:hover": {
              borderWidth: "1.5px",
              backgroundColor: "rgba(0, 184, 144, 0.06)",
            },
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            backgroundColor: "transparent",
            backgroundImage: "none",
            border: `1px solid ${borderColor}`,
            borderRadius: "14px !important",
            boxShadow: "none",
            overflow: "hidden",
            margin: "8px 0 !important",
            "&::before": {
              display: "none",
            },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            backgroundColor: safeMode === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 184, 144, 0.05)",
            padding: "8px 16px",
            transition: "all 0.2s ease",
            "&.Mui-expanded": {
              backgroundColor: safeMode === "dark" ? "rgba(0, 184, 144, 0.08)" : "rgba(0, 184, 144, 0.08)",
              borderBottom: `1px solid ${borderColor}`,
            },
            "&:hover": {
              backgroundColor: safeMode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 184, 144, 0.08)",
            },
          },
          content: {
            margin: "0 !important",
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            padding: "20px 24px",
            backgroundColor: safeMode === "dark" ? "rgba(15, 23, 42, 0.2)" : "rgba(255, 255, 255, 0.2)",
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 44,
            height: 24,
            padding: 0,
            display: "flex",
          },
          switchBase: {
            padding: 2,
            "&.Mui-checked": {
              transform: "translateX(20px)",
              color: "#fff",
              "& + .MuiSwitch-track": {
                opacity: 1,
                backgroundColor: primaryColor,
                borderColor: primaryColor,
              },
            },
          },
          thumb: {
            width: 20,
            height: 20,
            boxShadow: "0 2px 4px 0 rgba(0, 35, 11, 0.2)",
          },
          track: {
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.1)",
            backgroundColor: safeMode === "dark" ? "rgba(255,255,255,0.15)" : "#e2e8f0",
            opacity: 1,
            transition: "background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            color: primaryColor,
            height: 6,
          },
          thumb: {
            height: 18,
            width: 18,
            backgroundColor: "#fff",
            border: `3px solid ${primaryColor}`,
            "&:focus, &:hover, &.Mui-active": {
              boxShadow: "inherit",
            },
          },
          track: {
            height: 6,
            borderRadius: 3,
          },
          rail: {
            height: 6,
            borderRadius: 3,
            backgroundColor: safeMode === "dark" ? "rgba(255, 255, 255, 0.15)" : "#e2e8f0",
            opacity: 1,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              transition: "all 0.2s ease-out",
              backgroundColor: safeMode === "dark" ? "rgba(0, 0, 0, 0.15)" : "#ffffff",
              "& fieldset": {
                borderColor: borderColor,
              },
              "&:hover fieldset": {
                borderColor: primaryColor,
              },
              "&.Mui-focused fieldset": {
                borderColor: primaryColor,
                borderWidth: "1.5px",
              },
            },
          },
        },
      },
    },
  });
};
