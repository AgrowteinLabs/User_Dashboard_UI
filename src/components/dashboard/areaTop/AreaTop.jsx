import { MdOutlineMenu } from "react-icons/md";
import "./AreaTop.scss";
import { useContext, useEffect, useRef, useState } from "react";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
import { Calendar } from "react-date-range";
import { ThemeContext } from "../../../context/ThemeContext";
import { LIGHT_THEME } from "../../../constants/themeConstants";
import LogoLight from "../../../assets/images/Logo-B.png"; // Light mode logo
import LogoDark from "../../../assets/images/Logo.png"; // Dark mode logo

const AreaTop = () => {

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRangeRef = useRef(null);

  // Get current theme from ThemeContext
  const { theme } = useContext(ThemeContext);

  const handleInputClick = () => {
    setShowDatePicker(true);
  };

  const handleClickOutside = (event) => {
    if (dateRangeRef.current && !dateRangeRef.current.contains(event.target)) {
      setShowDatePicker(false);
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
    <div
      ref={dateRangeRef}
      className={`date-picker-wrapper ${!showDatePicker ? "hide-date-picker" : ""}`}
    >
      <input
        type="text"
        readOnly
        value={currentDate.toDateString()}
        onClick={handleInputClick}
        className="date-input"
      />
      {showDatePicker && (
        <Calendar
          date={currentDate}
          onChange={(date) => setCurrentDate(date)}
        />
      )}
    </div>
  </div>
</section>

  );
};

export default AreaTop;
