import React, { useEffect, useState } from "react";
import "./AreaCharts.scss";
import TemperatureHistory from "../../charts/temperature/TemperatureHistory";
import CurrentTemperature from "../../charts/temperature/CurrentTemperature";
import CurrentHumidity from "../../charts/humidity/CurrentHumidity";
import Last7DaysHumidity from "../../charts/humidity/HumidityHistory";
import CurrentCO2 from "../../charts/CO2/CurrentCO2Level";
import Last7DaysCO2 from "../../charts/CO2/CO2History";
import CurrentPHValue from "../../charts/pH/CurrentPHValue";
import PHValueHistory from "../../charts/pH/PHValueHistory";
import CurrentWaterLevel from "../../charts/waterLevel/CurrentWaterLevel";
import WaterLevelLast7Days from "../../charts/waterLevel/WaterLevelHistory";

// Assuming this is the function that fetches the sensor data
import { fetchSensorList } from "../api/fetchsensorlist"; 

const AreaCharts = () => {
  const [sensors, setSensors] = useState([]);

  // Fetch the sensor list when the component mounts
  useEffect(() => {
    const getSensors = async () => {
      try {
        const sensorList = await fetchSensorList(); // Fetch the list of available sensors
        setSensors(sensorList); // Update the state with the fetched sensors
      } catch (error) {
        console.error("Error fetching sensor list:", error);
      }
    };

    getSensors();
  }, []);

  // Helper function to check if a sensor is available
  const isSensorAvailable = (sensorName) => {
    return sensors.some((sensor) => sensor.name === sensorName);
  };

  return (
    <section className="content-area-charts">
      {isSensorAvailable("Temperature") && (
        <>
          <CurrentTemperature />
          <TemperatureHistory />
        </>
      )}

      {isSensorAvailable("pH Sensor") && (
        <>
          <CurrentPHValue />
          <PHValueHistory />
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
    </section>
  );
};

export default AreaCharts;
