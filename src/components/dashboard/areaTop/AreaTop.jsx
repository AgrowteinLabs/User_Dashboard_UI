import { MdOutlineMenu } from "react-icons/md";
import "./AreaTop.scss";
import { useContext, useEffect, useRef, useState } from "react";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
import { Calendar } from "react-date-range";

const AreaTop = () => {

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRangeRef = useRef(null);

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
        
        <h2 className="area-top-title">AGROWTRACK</h2>
      </div>
      <div className="area-top-r">
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
