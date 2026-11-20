import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  Tune as TuneIcon,
  DeviceThermostat as TempIcon,
  AcUnit as HumidityIcon,
  FilterHdr as Co2Icon,
  Water as WaterIcon,
  Sensors as SensorsIcon,
} from "@mui/icons-material";
import { useMqttSensorData } from "../../hooks/useMqttSensorData";
import { getProductIcon } from "../../utils/productIcons";
import "./ProductsPage.scss";

// Prefer the most relevant sensors for the compact preview (Temp > Humidity > CO2 > rest)
const sensorPreviewPriority = (name) => {
  const n = String(name).toLowerCase();
  if (n.includes("temp")) return 0;
  if (n.includes("humid")) return 1;
  if (n.includes("co2")) return 2;
  return 3;
};

const sensorPreviewIcon = (name) => {
  const n = String(name).toLowerCase();
  if (n.includes("temp")) return <TempIcon />;
  if (n.includes("humid")) return <HumidityIcon />;
  if (n.includes("co2")) return <Co2Icon />;
  if (n.includes("water")) return <WaterIcon />;
  return <SensorsIcon />;
};

const sensorUnit = (name) => {
  const n = String(name).toLowerCase();
  if (n.includes("temp")) return "°C";
  if (n.includes("humid")) return "%";
  if (n.includes("co2")) return "ppm";
  if (n.includes("water")) return "L";
  return "";
};

const formatSensorValue = (value) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object" && value !== null && "value" in value) {
    return formatSensorValue(value.value);
  }
  if (typeof value === "string" && /er/i.test(value)) return "Err";
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(1) : String(value);
};

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleOpen = () => {
    navigate(`/products/${product.uid}/data`, { state: { alias: product.alias } });
  };

  const displayName = product.customName || product.alias;
  const ProductIcon = getProductIcon(product.uid || displayName);
  const controlsCount = Array.isArray(product.controls) ? product.controls.length : 0;
  const { message: sensorMessage } = useMqttSensorData(product.uid);

  // Up to two most relevant live readings
  const previewKeys = Object.keys(sensorMessage || {})
    .sort((a, b) => sensorPreviewPriority(a) - sensorPreviewPriority(b))
    .slice(0, 2);

  // The API `status` field is derived from device state (state !== "OFF"), not
  // liveness. `lastSeen` is the authoritative MQTT heartbeat, so prefer its
  // freshness when present and fall back to `status` otherwise.
  const LAST_SEEN_STALE_MS = 5 * 60 * 1000;
  const lastSeenMs = product.lastSeen ? new Date(product.lastSeen).getTime() : null;
  const hasFreshHeartbeat =
    lastSeenMs != null && !Number.isNaN(lastSeenMs) && Date.now() - lastSeenMs < LAST_SEEN_STALE_MS;
  const isOnline =
    lastSeenMs != null && !Number.isNaN(lastSeenMs)
      ? hasFreshHeartbeat
      : product.status === "online";

  return (
    <div
      className="product-card"
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleOpen()}
    >
      <div className="product-card-glow" />

      <div className="product-card-header">
        <div className="product-avatar"><ProductIcon /></div>
        <div className="product-header-right">
          {product.isShared && <span className="product-shared-badge">Shared</span>}
          <span
            className={`product-status-dot ${isOnline ? "online" : "offline"}`}
            title={isOnline ? "Device online" : "Device offline"}
          />
        </div>
      </div>

      <div className="product-card-body">
        <h3 className="product-alias">{displayName}</h3>
        <p className="product-uid">
          <span className="uid-label">UID</span>
          <span className="uid-value">{product.uid}</span>
        </p>

        <div className="product-preview">
          {previewKeys.length > 0 ? (
            previewKeys.map((key) => (
              <div className="preview-item" key={key}>
                <span className="preview-icon">{sensorPreviewIcon(key)}</span>
                <span className="preview-meta">
                  <span className="preview-name">{key.replace(/_/g, " ")}</span>
                  <span className="preview-value">
                    {formatSensorValue(sensorMessage[key])}
                    {sensorUnit(key) && <em>{sensorUnit(key)}</em>}
                  </span>
                </span>
              </div>
            ))
          ) : (
            <div className="preview-empty">
              {isOnline ? "Awaiting live sensor data…" : "No live data"}
            </div>
          )}
        </div>
      </div>

      <div className="product-card-footer">
        <div className="product-meta">
          <span className={`product-status-text ${isOnline ? "online" : "offline"}`}>
            <span className="status-bullet" />
            {isOnline ? "Online" : "Offline"}
          </span>
          {controlsCount > 0 && (
            <span className="product-count-chip">
              <TuneIcon /> {controlsCount} controller{controlsCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button className="product-open-btn" onClick={handleOpen} tabIndex={-1}>
          View Analytics →
        </button>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    alias: PropTypes.string.isRequired,
    customName: PropTypes.string,
    status: PropTypes.string,
    lastSeen: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isShared: PropTypes.bool,
    controls: PropTypes.array,
  }).isRequired,
};

export default ProductCard;
