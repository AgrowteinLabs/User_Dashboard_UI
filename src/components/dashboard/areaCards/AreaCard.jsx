import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { FiClock, FiThermometer, FiPower } from "react-icons/fi";

const AreaCard = ({ colors, cardInfo, type }) => {
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (type === "time") {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [type]);

  const handlePowerSwitch = () => {
    setIsPowerOn(!isPowerOn);
  };

  const renderValue = () => {
    switch (type) {
      case "time":
        return new Date().toLocaleTimeString();
      case "temperature":
        return "25°C"; // Replace with actual temperature value
      case "power":
        return (
          <div className="power-switch">
            <FiPower
              size={24}
              color={isPowerOn ? "green" : "red"}
              onClick={handlePowerSwitch}
              style={{ cursor: "pointer" }}
            />
            <span>{isPowerOn ? "On" : "Off"}</span>
          </div>
        );
      default:
        return cardInfo.value;
    }
  };

  const renderIcon = () => {
    switch (type) {
      case "time":
        return <FiClock size={48} color={colors[1]} />;
      case "temperature":
        return <FiThermometer size={48} color={colors[1]} />;
      case "power":
        return (
          <FiPower
            size={48}
            color={isPowerOn ? "green" : "red"}
            onClick={handlePowerSwitch}
            style={{ cursor: "pointer" }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="area-card">
      <div className="area-card-info">
        <h5 className="info-title">{cardInfo.title}</h5>
        <div className="info-value">{renderValue()}</div>
      </div>
      <div className="area-card-icon">{renderIcon()}</div>
    </div>
  );
};

export default AreaCard;

AreaCard.propTypes = {
  colors: PropTypes.array.isRequired,
  cardInfo: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
};