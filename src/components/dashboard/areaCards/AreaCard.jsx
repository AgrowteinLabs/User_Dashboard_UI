import PropTypes from "prop-types";
import { useState, useEffect, useContext, useCallback } from "react";
import { FiClock, FiThermometer, FiPower } from "react-icons/fi";
import { ProductContext } from "../../../context/ProductContext";
import { fetcheddata } from "../api/fetchdata";
import { PowerButton } from "../api/powerButton";

const AreaCard = ({ colors, cardInfo, type, controlKey, children }) => {
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const { selectedProductUid } = useContext(ProductContext);
  const [isFetchingStopped, setIsFetchingStopped] = useState(false);

  useEffect(() => {
    if (type === "time") {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [type]);

  useEffect(() => {
    let isActive = true;
    let intervalId;

    const fetchData = async () => {
      if (!selectedProductUid || isFetchingStopped) {
        return;
      }

      try {
        const data = await fetcheddata(selectedProductUid);

        if (data.error === 404) {
          setIsFetchingStopped(true);
          setTemperature(null);
          setHumidity(null);
          clearInterval(intervalId);
          return;
        }

        if (!data || !data.data) {
          setTemperature(null);
          setHumidity(null);
          return;
        }

        const temp = data.data.Temperature;
        if (isActive) {
          setTemperature(temp !== null && temp !== undefined ? parseFloat(temp.toFixed(2)) : null);
          setHumidity(data.data.Humidity);
        }
      } catch (error) {
        if (isActive) {
          setTemperature(null);
          setHumidity(null);
        }
      }
    };

    intervalId = setInterval(fetchData, 1000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [selectedProductUid, isFetchingStopped]);

  const handlePowerSwitch = useCallback(async () => {
    const newPowerState = !isPowerOn;
    const command = `${controlKey}${newPowerState ? "on" : "off"}`;

    try {
      await PowerButton(selectedProductUid, command);
      setIsPowerOn(newPowerState);
    } catch (error) {
      console.error("Error switching power:", error);
    }
  }, [isPowerOn, selectedProductUid, controlKey]);

  const renderValue = () => {
    switch (type) {
      case "time":
        return currentTime.toLocaleTimeString();
      case "temperature":
        return temperature !== null
          ? `${temperature} °C`
          : <span className="error-text">Sensor Error</span>;
      case "humidity":
        return humidity !== null
          ? `${humidity} %`
          : <span className="error-text">Sensor Error</span>;
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
        {children && <div className="area-card-children">{children}</div>}
      </div>
      <div className="area-card-icon">{renderIcon()}</div>
    </div>
  );
};

AreaCard.propTypes = {
  colors: PropTypes.array.isRequired,
  cardInfo: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
  controlKey: PropTypes.string,
  children: PropTypes.node, // New prop type for children
};

export default AreaCard;
