import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import "./DeviceStatusBanner.scss";

const STALE_TIMEOUT = 60 * 1000; // 60 seconds

const DeviceStatusBanner = ({ lastSeen }) => {
  const [tick, setTick] = useState(Date.now());

  // Re-evaluate status every 10s
  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const isOffline = !lastSeen || tick - lastSeen > STALE_TIMEOUT;

  const statusIcon = isOffline ? "🔴" : "🟢";
  const statusText = isOffline ? "Device is offline" : "Device is online";
  const lastUpdated = lastSeen
    ? new Date(lastSeen).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className={`device-status-banner ${isOffline ? "offline" : "online"}`}>
      <p className="status-text">
        {statusIcon} <strong>{statusText}</strong>
      </p>
      <p className="last-seen">
        Last data received: <strong>{lastUpdated}</strong>
      </p>
    </div>
  );
};

DeviceStatusBanner.propTypes = {
  lastSeen: PropTypes.number,
};

export default DeviceStatusBanner;
