import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../../../context/ThemeContext";
import { LIGHT_THEME } from "../../../constants/themeConstants";
import LogoLight from "../../../assets/images/Logo-B.png";
import LogoDark from "../../../assets/images/Logo.png";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { Chip } from "@mui/material";
import dayjs from "dayjs";
import "./AreaTop.scss";

const AreaTop = () => {
  const { theme } = useContext(ThemeContext);
  const [currentTime, setCurrentTime] = useState(dayjs());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000); // Live clock with seconds

    return () => clearInterval(interval);
  }, []);

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
        
      </div>
    </section>
  );
};

export default AreaTop;
