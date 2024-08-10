import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { FiClock, FiThermometer, FiPower } from "react-icons/fi";
import findTempAndHumidity from "../api/fetchpdata";
import { CircularProgress } from "@mui/material";


const AreaCard = ({ colors, cardInfo, type }) => {
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);

  useEffect(() => {
    if (type === "time") {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [type]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await findTempAndHumidity();
      if (data) {
        setTemperature(data.lastTemperature);
        setHumidity(data.lastHumidityLevel);
      }
    };
    fetchData();
  }, []);

  const handlePowerSwitch = () => {
    setIsPowerOn(!isPowerOn);

  };

  const renderValue = () => {
    switch (type) {
      case "time":
        return currentTime.toLocaleTimeString();
      case "temperature":
        return temperature !== null ? temperature : <CircularProgress/>;
      case "humidity":
        return humidity !== null ? humidity : "Loading...";
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
      case "humidity":
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

AreaCard.propTypes = {
  colors: PropTypes.array.isRequired,
  cardInfo: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
};

export default AreaCard;
