import { useContext, useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import { ProductContext } from "../../../context/ProductContext";
import { useMqttSensorData } from "../../../hooks/useMqttSensorData";
import { fetchSensorList } from "../../../api/fetchsensorlist";
import "./AreaTable.scss";

const TABLE_HEADS = ["Sensor Name", "Status", "Last Updated"];
const STALE_THRESHOLD_MS = 60 * 1000; // 60 seconds

const AreaTable = () => {
  const { selectedProductUid } = useContext(ProductContext);
  const { message: mqttMessage, lastReceivedTime } = useMqttSensorData(selectedProductUid);

  const [availableSensors, setAvailableSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(Date.now());

  // Force re-evaluation of stale sensors every 10s
  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch available sensors on mount or uid change
  useEffect(() => {
    const loadSensors = async () => {
      if (!selectedProductUid) return;
      setLoading(true);
      try {
        const result = await fetchSensorList(selectedProductUid);
        const names = result.map((s) => s.name);
        setAvailableSensors(names);
      } catch (err) {
        console.error("Failed to fetch sensor list", err);
      } finally {
        setLoading(false);
      }
    };

    loadSensors();
  }, [selectedProductUid]);

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "--";
    const diff = tick - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 5) return `${minutes} min ago`;
    return ">5 min ago";
  };

  const getStatus = (sensorName) => {
    const sensorValue = mqttMessage?.[sensorName];
    const timestamp = lastReceivedTime;

    if (!mqttMessage || sensorValue === undefined || sensorValue === null) return "inactive";
    if (typeof sensorValue === "string" && sensorValue.includes("-er")) return "error";
    if (!timestamp || tick - timestamp > STALE_THRESHOLD_MS) return "stale";
    return "active";
  };

  const sensorEntries = availableSensors.map((sensorName) => {
    const status = getStatus(sensorName);
    const lastSeen = getTimeAgo(lastReceivedTime);
    return {
      name: sensorName,
      status,
      lastSeen: status === "inactive" ? "--" : lastSeen,
    };
  });

  return (
    <div className="area-table">
      {loading ? (
        <div className="loading-spinner">
          <CircularProgress />
        </div>
      ) : availableSensors.length === 0 ? (
        <div className="loading-spinner">
          <p>⚠️ No sensors found for this product.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              {TABLE_HEADS.map((head, index) => (
                <th key={index}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sensorEntries.map((sensor, index) => (
              <tr key={index}>
                <td>{sensor.name.replace(/_/g, " ")}</td>
                <td>
                  <div className="dt-status">
                    <span className={`dt-status-dot dot-${sensor.status}`}></span>
                    <span className="dt-status-text">{sensor.status}</span>
                  </div>
                </td>
                <td>{sensor.lastSeen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AreaTable;
