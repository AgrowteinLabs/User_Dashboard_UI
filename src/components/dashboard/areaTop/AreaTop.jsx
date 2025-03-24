import { useContext, useEffect, useRef, useState } from "react";
import { ThemeContext } from "../../../context/ThemeContext";
import { LIGHT_THEME } from "../../../constants/themeConstants";
import LogoLight from "../../../assets/images/Logo-B.png"; // Light mode logo
import LogoDark from "../../../assets/images/Logo.png"; // Dark mode logo
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import "./AreaTop.scss";
import dayjs from "dayjs";

const AreaTop = () => {
  const [currentDate, setCurrentDate] = useState(dayjs()); // Initialize current date
  const dateRangeRef = useRef(null);

  // Get current theme from ThemeContext
  const { theme } = useContext(ThemeContext);

  const handleClickOutside = (event) => {
    if (dateRangeRef.current && !dateRangeRef.current.contains(event.target)) {
      // Logic can be added here if needed when clicking outside
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
        {/* Date Picker Section */}
        <div ref={dateRangeRef} className="date-picker-wrapper">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DesktopDatePicker
              value={currentDate}
              onChange={(newValue) => {
                if (newValue) setCurrentDate(newValue); // Update the date
              }}
              renderInput={({ inputRef, inputProps, InputProps }) => (
                <div className="date-input-wrapper">
                  {/* Input field to display the date */}
                  <input
                    ref={inputRef}
                    {...inputProps}
                    value={currentDate.format("DD-MM-YYYY")} // Display formatted current date
                    readOnly
                    className="date-input"
                  />
                  {InputProps?.endAdornment}
                </div>
              )}
            />
          </LocalizationProvider>
        </div>
      </div>
    </section>
  );
};

export default AreaTop;
