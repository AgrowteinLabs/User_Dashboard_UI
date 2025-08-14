import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import BarChartCard from "./BarChartCard";
import AreaChartCard from "./AreaChartCard";
import "../dashboard/areaCharts/AreaCharts.scss";

const sensorChartMap = {
  Temperature_1: { type: "bar", unit: "°C", label: "Temperature 1" },
  Temperature_2: { type: "bar", unit: "°C", label: "Temperature 2" },
  Temperature: { type: "bar", unit: "°C", label: "Temperature" },
  Humidity_1: { type: "bar", unit: "%", label: "Humidity 1" },
  Humidity_2: { type: "bar", unit: "%", label: "Humidity 2" },
  Humidity: { type: "bar", unit: "%", label: "Humidity" },
  pH: { type: "area", unit: "", label: "pH Level" },
  Water_Used: { type: "area", unit: "L", label: "Water Used" },
  Co2: { type: "bar", unit: "ppm", label: "CO₂ Level" },
  Bed_Temperature: { type: "bar", unit: "°C", label: "Bed Temperature" },
  Boiler_Temperature: { type: "bar", unit: "°C", label: "Boiler Temperature" },
  Pressure: { type: "bar", unit: "Pa", label: "Pressure" },
  Flow_Rate: { type: "bar", unit: "L/min", label: "Flow Rate" },
  Turbidity: { type: "bar", unit: "NTU", label: "Turbidity" },
  TDS: { type: "bar", unit: "ppm", label: "TDS" },
  "Electric Conductivity": {
    type: "bar",
    unit: "ppm",
    label: "Electric Conductivity",
  },
  "Dissolved Oxygen": { type: "bar", unit: "mg/L", label: "Dissolved Oxygen" },
  "CO2 Sensor 1": { type: "bar", unit: "ppm", label: "CO2 Sensor 1" },
  "CO2 Sensor 2": { type: "bar", unit: "ppm", label: "CO2 Sensor 2" },
  "CO2 Sensor 3": { type: "bar", unit: "ppm", label: "CO2 Sensor 3" },
  "CO2 Sensor 4": { type: "bar", unit: "ppm", label: "CO2 Sensor 4" },
};

const isStale = (timestamp) => {
  const now = Date.now();
  const STALE_THRESHOLD = 60 * 1000; // 1 min
  return !timestamp || now - timestamp > STALE_THRESHOLD;
};

// ✅ New helper to normalize raw sensor values
const normalizeSensorData = (data, globalTimestamp) => {
  const normalized = {};
  for (const key in data) {
    const value = data[key];
    if (typeof value === "number") {
      normalized[key] = {
        status: "live",
        value,
        timestamp: globalTimestamp || Date.now(),
      };
    } else if (typeof value === "object" && value !== null) {
      normalized[key] = value;
    }
  }
  return normalized;
};

const DynamicCharts = ({
  current,
  history,
  availableSensors,
  historyOnly = false,
}) => {
  const globalTimestamp = current?.data?.timestamp || Date.now();

  // Normalize all sensor values so even raw numbers work
  const currentData = normalizeSensorData(current?.data || {}, globalTimestamp);

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {Object.entries(sensorChartMap)
        .filter(([sensorKey]) =>
          availableSensors.some(
            (sensor) => sensor.toLowerCase() === sensorKey.toLowerCase()
          )
        )
        .map(([sensorKey, config]) => {
          const sensorInfo = currentData[sensorKey];
          const historyData = history[sensorKey] || [];

          const labels = historyData.map((entry) =>
            new Date(entry.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          );

          const values = historyData.map((entry) =>
            parseFloat(entry.value).toFixed(2)
          );

          const currentStatus = !sensorInfo
            ? "no-data"
            : sensorInfo.status === "error"
            ? "error"
            : isStale(sensorInfo.timestamp)
            ? "stale"
            : "live";

          const isFullHistory =
            ["stale", "error", "no-data"].includes(currentStatus) ||
            historyOnly;

          return (
            <div
              className={`chart-pair ${isFullHistory ? "full-history" : ""}`}
              key={sensorKey}
            >
              {!historyOnly && currentStatus === "live" ? (
                <div className="chart-current">
                  <BarChartCard
                    title={`${config.label} - Current`}
                    value={parseFloat(sensorInfo.value).toFixed(2)}
                    unit={config.unit}
                    status="active"
                    timestamp={sensorInfo.timestamp}
                  />
                </div>
              ) : (
                !historyOnly && (
                  <div className="chart-current">
                    <div className="sensor-error">
                      {currentStatus === "error"
                        ? "Sensor Error"
                        : currentStatus === "stale"
                        ? "No Real-Time Data"
                        : "No Data"}
                    </div>
                  </div>
                )
              )}

              <div className="chart-history">
                {historyData.length > 0 ? (
                  <AreaChartCard
                    title={`${config.label} History (Last 24 Hours)`}
                    data={values}
                    labels={labels}
                    unit={config.unit}
                  />
                ) : (
                  <div className="sensor-error">No history data available</div>
                )}
              </div>
            </div>
          );
        })}
    </>
  );
};

DynamicCharts.propTypes = {
  current: PropTypes.shape({
    data: PropTypes.object,
  }).isRequired,
  history: PropTypes.object.isRequired,
  availableSensors: PropTypes.arrayOf(PropTypes.string).isRequired,
  historyOnly: PropTypes.bool,
};

export default DynamicCharts;
