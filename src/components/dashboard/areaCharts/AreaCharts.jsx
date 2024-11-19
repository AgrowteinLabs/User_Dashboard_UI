import React, { useEffect, useState, useContext } from "react";
import { fetchSensorList } from "../api/fetchsensorlist";
import "./AreaCharts.scss";
import { CircularProgress } from "@mui/material";
import { ProductContext } from "../../../context/ProductContext";
import TemperatureHistory from "../../charts/temperature/TemperatureHistory";
import CurrentTemperature from "../../charts/temperature/CurrentTemperature";
import CurrentHumidity from "../../charts/humidity/CurrentHumidity";
import Last7DaysHumidity from "../../charts/humidity/HumidityHistory";
import CurrentCO2 from "../../charts/CO2/CurrentCO2Level";
import Last7DaysCO2 from "../../charts/CO2/CO2History";
import CurrentPHValue from "../../charts/pH/CurrentPHValue";
import Last7DaysPHValue from "../../charts/pH/PHValueHistory";
// import CurrentWaterLevel from "../../charts/waterLevel/CurrentWaterLevel";
// import WaterLevelLast7Days from "../../charts/waterLevel/WaterLevelHistory";

const AreaCharts = () => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedProductUid) {
        setError("Please select a product to view sensors.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchSensorList(selectedProductUid);
        setSensors(data);
      } catch (error) {
        setError("Failed to fetch sensor data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProductUid]);

  const isSensorAvailable = (sensorName) => {
    return sensors.some(sensor => sensor.name.toLowerCase() === sensorName.toLowerCase());
  };  

  return (
    <section className="content-area-charts">
      {loading ? (
        <div className="loading-spinner">
          <CircularProgress />
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {isSensorAvailable("Temperature Sensor") && (
  <>
    <CurrentTemperature />
    <TemperatureHistory />
  </>
)}

          {isSensorAvailable("pH Sensor") && (
            <>
              <CurrentPHValue />
              <Last7DaysPHValue />
            </>
          )}

          {isSensorAvailable("WaterLevel") && (
            <>
              <CurrentWaterLevel />
              <WaterLevelLast7Days />
            </>
          )}

          {isSensorAvailable("Humidity") && (
            <>
              <CurrentHumidity />
              <Last7DaysHumidity />
            </>
          )}

          {isSensorAvailable("Co2") && (
            <>
              <CurrentCO2 />
              <Last7DaysCO2 />
            </>
          )}
        </>
      )}
    </section>
  );
};

export default AreaCharts;
