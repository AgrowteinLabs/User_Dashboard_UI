import PropTypes from "prop-types";
import { useState, useEffect, useContext } from "react";
import { FiClock, FiThermometer, FiPower } from "react-icons/fi";
import { CircularProgress } from "@mui/material";
import { ProductContext } from "../../../context/ProductContext";
import { fetcheddata } from "../api/fetchdata";
import { PowerButton } from "../api/powerButton";

const AreaCard = ({ colors, cardInfo, type, controlName }) => {
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState(undefined);
  const [humidity, setHumidity] = useState(null);
  const { selectedProductUid } = useContext(ProductContext);

  // Handling current time updates
  useEffect(() => {
    if (type === "time") {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [type]);

  // Fetching temperature and humidity data
  useEffect(() => {
    let isActive = true; // Flag to manage async operation

    const fetchData = async () => {
      if (!selectedProductUid) {
        console.warn("Product UID is not set");
        return;
      }

      try {
        const data = await fetcheddata(selectedProductUid);
        if (data && data.data && isActive) {
          setTemperature(data.data.Temperature);
          setHumidity(data.data.Humidity);
        } else {
          throw new Error("Incomplete sensor data received");
        }
      } catch (error) {
        if (isActive) {
          setTemperature(undefined); // Trigger error display
          console.error("Error fetching sensor data:", error);
        }
      }
    };

    fetchData();

    return () => {
      isActive = false; // Cancel the subscription
    };
  }, []);

  // Power switch handling
  const handlePowerSwitch = async () => {
    const newPowerState = !isPowerOn;
    const command = `${controlName}${newPowerState ? "on" : "off"}`;

    try {
      await PowerButton(selectedProductUid, command);
      setIsPowerOn(newPowerState); // Update state only if API call is successful
    } catch (error) {
      console.error("Error switching power:", error);
    }
  };

  // Render value based on the type
  const renderValue = () => {
    switch (type) {
      case "time":
        return currentTime.toLocaleTimeString();
      case "temperature":
        if (temperature === undefined || temperature === null) {
          return "Sensor Error";
        }
        return `${temperature} °C`;
      case "humidity":
        return humidity !== null && humidity !== undefined
          ? `${humidity} %`
          : "Loading...";
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

  // Render the appropriate icon based on the type
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
  controlName: PropTypes.string // Added prop type for controlName
};

export default AreaCard;
