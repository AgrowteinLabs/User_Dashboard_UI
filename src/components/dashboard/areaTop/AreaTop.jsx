import { MdOutlineMenu } from "react-icons/md";
import "./AreaTop.scss";
import { useContext, useEffect, useRef, useState } from "react";
import { ThemeContext } from "../../../context/ThemeContext";
import { LIGHT_THEME } from "../../../constants/themeConstants";
import LogoLight from "../../../assets/images/Logo-B.png"; // Light mode logo
import LogoDark from "../../../assets/images/Logo.png"; // Dark mode logo
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimeField } from "@mui/x-date-pickers/DateTimeField";
import dayjs from "dayjs";

const AreaTop = () => {
  const [currentDate, setCurrentDate] = useState(dayjs()); // Initialize current date
  const dateRangeRef = useRef(null);

  // Get current theme from ThemeContext
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(dayjs()); // Update time every second
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  return (
    <section className="content-area-top">
      <div className="area-top-l">
        {/* Logo Section */}
        <img
          src={theme === LIGHT_THEME ? LogoLight : LogoDark}
          alt="AGROWTRACK Logo"
          className="area-top-logo"
        />
      </div>
      <div className="area-top-r">
        {/* Date-Time Display Section */}
        <div ref={dateRangeRef} className="date-picker-wrapper">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimeField
              label="Current Date & Time"
              value={currentDate}
              format="LLL" // Full month name with date and time
              className="date-input"
              readOnly // Prevent user modification
            />
          </LocalizationProvider>
        </div>
      </div>
    </section>
  );
};

export default AreaTop;
