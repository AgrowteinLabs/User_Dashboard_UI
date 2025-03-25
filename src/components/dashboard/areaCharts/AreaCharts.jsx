import { useEffect, useState, useContext } from "react";
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
import CurrentPressure from "../../charts/pressure/CurrentPressure";
import PressureHistory from "../../charts/pressure/PressureHistory";
import BedTemperatureCurrent from "../../charts/BedTemp/BedTemperatureCurrent"; // New import
import BedTemperatureHistory from "../../charts/BedTemp/BedTemperatureHistory"; // New import
import BoilerTemperatureCurrent from "../../charts/BoilerTemp/BoilerTemperatureCurrent"; // New import
import BoilerTemperatureHistory from "../../charts/BoilerTemp/BoilerTemperatureHistory"; // New import
// import ElectricConductivityCurrent from "../../charts/electricconductivity/ElectricConductivityCurrent";
// import ElectricConductivityHistory from "../../charts/electricconductivity/ElectricConductivityHistory";
import CurrentFlowrate from "../../charts/flowrate/CurrentFlowrate"
import FlowrateHistory from "../../charts/flowrate/FlowrateHistory"
import Swal from "sweetalert2";
import WaterUsedCurrent from "../../charts/waterLevel/CurrentWaterLevel";
import WaterUsedHistory from "../../charts/waterLevel/WaterLevelHistory";

const AreaCharts = () => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedProductUid) {
        setLoading(true);
        setTimeout(() => {
          setError("Please select a product to view sensors.");
          setLoading(false);
        }, 3000);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchSensorList(selectedProductUid);
        setSensors(data);
      } catch (error) {
        Swal.fire("Error", "Failed to fetch sensor data.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProductUid]);

  const isSensorAvailable = (sensorName) => {
    return sensors.some(
      (sensor) => sensor.name.toLowerCase() === sensorName.toLowerCase()
    );
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
          {isSensorAvailable("Temperature") && (
            <>
              <CurrentTemperature />
              <TemperatureHistory />
            </>
          )}


          {isSensorAvailable("pH") && (
            <>
              <CurrentPHValue />
              <Last7DaysPHValue />
            </>
          )}

          {isSensorAvailable("Water_Used") && (
            <>
              <WaterUsedCurrent />
              <WaterUsedHistory />
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


          {isSensorAvailable("Bed_Temperature") && (
            <>
              <BedTemperatureCurrent />
              <BedTemperatureHistory />
            </>
          )}

          {isSensorAvailable("Boiler_Temperature") && (
            <>
              <BoilerTemperatureCurrent />
              <BoilerTemperatureHistory />
            </>
          )}

          {isSensorAvailable("Pressure") && (
            <>
              <CurrentPressure />
              <PressureHistory />
            </>
          )}
          
          {isSensorAvailable("Flow_Rate") && (
            <>
              < CurrentFlowrate/>
              <FlowrateHistory />
            </>
          )}


        </>
      )}
    </section>
  );
};

export default AreaCharts;
