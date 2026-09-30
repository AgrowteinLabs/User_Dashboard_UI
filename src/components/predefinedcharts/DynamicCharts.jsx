import PropTypes from "prop-types";
import { useEffect, useState, memo } from "react";
import BarChartCard from "./BarChartCard";
import AreaChartCard from "./AreaChartCard";
import { CircularProgress } from "@mui/material";
import { useInView } from "react-intersection-observer";
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
  Bed_Temperature: { type: "bar", unit: "°C", label: "Bed Temperature" },
  Boiler_Temperature: { type: "bar", unit: "°C", label: "Boiler Temperature" },
  Pressure: { type: "bar", unit: "Pa", label: "Pressure" },
  Flow_Rate: { type: "bar", unit: "L/min", label: "Flow Rate" },
  Turbidity: { type: "bar", unit: "NTU", label: "Turbidity" },
  TDS: { type: "bar", unit: "ppm", label: "Electric Conductivity" },
  "Electric Conductivity": { type: "bar", unit: "ppm", label: "Electric Conductivity" },
  "Dissolved Oxygen": { type: "bar", unit: "mg/L", label: "Dissolved Oxygen" },
  "CO2 Sensor 1": { type: "bar", unit: "ppm", label: "CO2 Sensor 1" },
  "CO2 Sensor 2": { type: "bar", unit: "ppm", label: "CO2 Sensor 2" },
  "CO2 Sensor 3": { type: "bar", unit: "ppm", label: "CO2 Sensor 3" },
  "CO2 Sensor 4": { type: "bar", unit: "ppm", label: "CO2 Sensor 4" },
  "CO2 Sensor": { type: "bar", unit: "ppm", label: "CO₂ Level" },
  CO2: { type: "bar", unit: "ppm", label: "CO₂ Level" },
  O3: { type: "bar", unit: "ppb", label: "O₃" },
  NO2: { type: "bar", unit: "ppb", label: "NO₂" },
  SO2: { type: "bar", unit: "ppb", label: "SO₂" },
  CH2O: { type: "bar", unit: "ug/m3", label: "CH₂O" },
  CO: { type: "bar", unit: "ppm", label: "CO" },
  Gas_Kohm: { type: "bar", unit: "kΩ", label: "Gas Sensor (KΩ)" },
  Water_Level: { type: "area", unit: "cm", label: "Water Level" },
  "Water Level": { type: "area", unit: "cm", label: "Water Level" },
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
    // Handle objects with value property
    if (typeof value === "object" && value !== null && "value" in value) {
      normalized[key] = {
        status: value.status || "live",
        value: value.value,
        timestamp: value.timestamp || globalTimestamp || Date.now(),
      };
    }
    // Handle raw numbers
    else if (typeof value === "number" || !isNaN(parseFloat(value))) {
      normalized[key] = {
        status: "live",
        value: parseFloat(value),
        timestamp: globalTimestamp || Date.now(),
      };
    }
  }
  return normalized;
};

// Memoized chart pair component for performance
const ChartPair = memo(({ config, sensorInfo, historyData, historyOnly, historyLoading, currentStatus, isFullHistory }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '200px'
  });

  const labels = historyData.map((entry) =>
    new Date(entry.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  const values = historyData.map((entry) =>
    parseFloat(entry.value).toFixed(2)
  );

  return (
    <div
      ref={ref}
      className={`chart-pair ${isFullHistory ? "full-history" : ""}`}
    // key prop removed here as it should be on the component instance, not the root element
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
        {historyLoading ? (
          <div className="history-loading">
            <CircularProgress size={24} />
            <span style={{ marginLeft: "8px" }}>Loading history...</span>
          </div>
        ) : !inView ? (
          <div className="history-loading">
            <CircularProgress size={24} />
          </div>
        ) : historyData.length > 0 ? (
          <AreaChartCard
            title={`${config.label} History (Last 12 Hours)`}
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
});

ChartPair.displayName = 'ChartPair';

ChartPair.propTypes = {

  config: PropTypes.shape({
    label: PropTypes.string,
    unit: PropTypes.string,
  }).isRequired,
  sensorInfo: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    timestamp: PropTypes.number,
    status: PropTypes.string,
  }),
  historyData: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    timestamp: PropTypes.number,
  })).isRequired,
  historyOnly: PropTypes.bool,
  historyLoading: PropTypes.bool,
  currentStatus: PropTypes.string.isRequired,
  isFullHistory: PropTypes.bool.isRequired,
};

const DynamicCharts = ({
  current,
  history,
  availableSensors,
  historyOnly = false,
  historyLoading = false,
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
          // Loose lookup to handle "Water Level" vs "Water_Level" mismatch
          const lookup = (src, k) => src[k] || src[k.replace(/ /g, "_")] || src[k.replace(/_/g, " ")];
          const sensorInfo = lookup(currentData, sensorKey);
          const historyData = lookup(history, sensorKey) || [];

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
            <ChartPair
              key={sensorKey}

              config={config}
              sensorInfo={sensorInfo}
              historyData={historyData}
              historyOnly={historyOnly}
              historyLoading={historyLoading}
              currentStatus={currentStatus}
              isFullHistory={isFullHistory}
            />
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
  historyLoading: PropTypes.bool,
};

export default DynamicCharts;
