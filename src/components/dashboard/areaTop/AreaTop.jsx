import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../../../context/ThemeContext";
import { LIGHT_THEME } from "../../../constants/themeConstants";
import LogoLight from "../../../assets/images/Logo-B.png";
import LogoDark from "../../../assets/images/Logo.png";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HomeIcon from "@mui/icons-material/Home"; // Import Home Icon
import { Chip, Tooltip } from "@mui/material"; // Tooltip for hover effect
import dayjs from "dayjs";
import "./AreaTop.scss";

const AreaTop = () => {
  const { theme } = useContext(ThemeContext);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [isHomepage, setIsHomepage] = useState("dashboard"); // Default to Dashboard

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000); // Live clock with seconds

    return () => clearInterval(interval);
  }, []);

  // Set the homepage based on localStorage
  useEffect(() => {
    const homepagePreference = localStorage.getItem("homepagePreference") || "dashboard";
    setIsHomepage(homepagePreference); // Set based on saved preference or default to dashboard
  }, []);

  const handleSetHomepage = (page) => {
    localStorage.setItem("homepagePreference", page);
    setIsHomepage(page);
  };

  return (
    <section className="content-area-top">
      <div className="area-top-left">
        <img
          src={theme === LIGHT_THEME ? LogoLight : LogoDark}
          alt="AGROWTRACK Logo"
          className="area-top-logo"
        />
      </div>

      <div className="area-top-right">
        <Chip
          icon={<AccessTimeIcon />}
          label={currentTime.format("dddd, MMM D • hh:mm:ss A")}
          className="clock-chip"
        />

        <Tooltip title="Set as Homepage" arrow>
          <HomeIcon
            className="home-icon"
            onClick={() => handleSetHomepage(isHomepage === "dashboard" ? "productsOverview" : "dashboard")}
            style={{
              cursor: "pointer",
              color: isHomepage === "dashboard" ? "#03856d" : "lightgray", // Active color or gray
              fontSize: "2rem", // Adjust size as needed
              transition: "color 0.3s ease",
            }}
            aria-label="Set Homepage"
          />
        </Tooltip>
      </div>
    </section>
  );
};

export default AreaTop;
