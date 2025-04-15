// src/components/PredefinedCharts/DynamicCharts.jsx
import PropTypes from "prop-types";
import BarChartCard from "./BarChartCard";
import AreaChartCard from "./AreaChartCard";
import "../dashboard/areaCharts/AreaCharts.scss";

const sensorChartMap = {
  Temperature_1: { type: "bar", unit: "°C", label: "Temperature 1" },
  Temperature_2: { type: "bar", unit: "°C", label: "Temperature 2" },
  Humidity_1: { type: "bar", unit: "%", label: "Humidity 1" },
  Humidity_2: { type: "bar", unit: "%", label: "Humidity 2" },
  pH: { type: "area", unit: "", label: "pH Level" },
  Water_Used: { type: "area", unit: "L", label: "Water Used" },
  Co2: { type: "bar", unit: "ppm", label: "CO₂ Level" },
  Bed_Temperature: { type: "bar", unit: "°C", label: "Bed Temperature" },
  Boiler_Temperature: { type: "bar", unit: "°C", label: "Boiler Temperature" },
  Pressure: { type: "bar", unit: "Pa", label: "Pressure" },
  Flow_Rate: { type: "bar", unit: "L/min", label: "Flow Rate" },
};

const DynamicCharts = ({ current, history, availableSensors }) => {
  return (
    <div>
      {Object.entries(current.data || {})
  .filter(([sensorKey]) => availableSensors.includes(sensorKey.toLowerCase()))
  .slice(0, 5)
  .map(([sensorKey, sensorInfo]) => {
    const config = sensorChartMap[sensorKey];
    if (!config) return null;

    const status = sensorInfo.status;
    const value = sensorInfo.value;
    const historyData = history[sensorKey] || [];

    const labels = historyData.map((item) =>
      new Date(item.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
    const values = historyData.map((item) =>
      parseFloat(item.value).toFixed(2)
    );

    return (
      <div className="chart-pair" key={sensorKey}>
        <div className="chart-current">
          {status === "error" ? (
            <div className="sensor-error">Sensor Error</div>
          ) : (
            <BarChartCard
              title={`${config.label} - Current`}
              value={parseFloat(value).toFixed(2)}
              unit={config.unit}
            />
          )}
        </div>
        <div className="chart-history">
          {historyData.length > 0 ? (
            <AreaChartCard
              title={`${config.label} History (Last 24 Hours)`}
              data={values}
              labels={labels}
              unit={config.unit}
            />
          ) : (
            <div className="sensor-error">No history data available.</div>
          )}
        </div>
      </div>
    );
  })}

    </div>
  );
};

DynamicCharts.propTypes = {
  current: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  availableSensors: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default DynamicCharts;
