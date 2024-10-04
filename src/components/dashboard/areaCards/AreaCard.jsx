import PropTypes from "prop-types";
import { useState, useEffect, useContext } from "react";
import { FiClock, FiThermometer, FiPower } from "react-icons/fi";
import { ProductContext } from "../../../context/ProductContext";
import { fetcheddata } from "../api/fetchdata";
import { PowerButton } from "../api/powerButton";

const AreaCard = ({ colors, cardInfo, type, controlName, controlKey }) => {
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
        console.warn("Product UID is not set or fetching stopped");
        return;
      }

      try {
        const { data } = await fetcheddata(selectedProductUid);

        if (data.error === 404) {
          console.error("Error 404: Resource not found. Stopping fetch attempts.");
          setTemperature(null);
          setHumidity(null);
          setIsFetchingStopped(true);
          clearInterval(intervalId);
          return;
        }

        if (!data || !data.data) {
          console.warn("No valid data returned from fetcheddata");
          setTemperature(null);
          setHumidity(null);
          return;
        }

        if (type === "temperature" && data.data.Temperature !== undefined) {
          setTemperature(Number(data.data.Temperature).toFixed(2)); // Format to 2 decimal places
        }

        if (type === "humidity" && data.data.Humidity !== undefined) {
          setHumidity(Number(data.data.Humidity));
        }

      } catch (error) {
        if (isActive) {
          console.error("Error fetching sensor data:", error);
          setTemperature(null);
          setHumidity(null);
        }
      }
    };

    if (type === "temperature" || type === "humidity") {
      intervalId = setInterval(fetchData, 5000);
      fetchData();
    }

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [selectedProductUid, type, isFetchingStopped]);

  const handlePowerSwitch = async () => {
    const newPowerState = !isPowerOn;
    const command = `${controlKey}${newPowerState ? "on" : "off"}`;

    try {
      await PowerButton(selectedProductUid, command);
      setIsPowerOn(newPowerState);
    } catch (error) {
      console.error("Error switching power:", error);
    }
  };

  const renderValue = () => {
    switch (type) {
      case "time":
        return currentTime.toLocaleTimeString();
      case "temperature":
        return temperature !== null ? `${temperature} °C` : <span style={{ color: "red", fontWeight: "bold" }}>Sensor Error</span>;
      case "humidity":
        return humidity !== null ? `${humidity} %` : <span style={{ color: "red", fontWeight: "bold" }}>Sensor Error</span>;
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
  controlName: PropTypes.string,
  controlKey: PropTypes.string,
};

export default AreaCard;
