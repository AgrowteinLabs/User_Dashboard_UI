import { useMemo, useContext } from "react";
import PropTypes from "prop-types";
import { ProductContext } from "../../context/ProductContext";
import { useMqttControllerStatus } from "../../hooks/useMqttControllerStatus";
import { handleBoundaryWheel } from "../../utils/scrollHelper";
import "./ControlStatusPanel.scss";

const normalizeKey = (key) => key?.toString().trim().toLowerCase() || "";

const formatTime = (ts) => {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleTimeString();
  } catch (_err) {
    return "—";
  }
};

const StateBadge = ({ state }) => {
  const normalized = (state || "").toString().toUpperCase();
  const className = `state-badge ${normalized === "ON" ? "on" : normalized === "OFF" ? "off" : ""}`;
  return <span className={className}>{normalized || "UNKNOWN"}</span>;
};

StateBadge.propTypes = {
  state: PropTypes.string,
};

const ControlStatusPanel = ({ configExpanded, setConfigExpanded }) => {
  const { selectedProductUid, selectedProduct } = useContext(ProductContext);
  const controls = useMemo(() => selectedProduct?.controls || [], [selectedProduct]);
  const { statusMap, connected } = useMqttControllerStatus(selectedProductUid);

  const enrichedControls = useMemo(() => {
    return (controls || []).map((control) => {
      const controlIdKey = normalizeKey(control.controlId);
      const pinKey = normalizeKey(control.pin);
      let live = null;
      if (controlIdKey && statusMap[controlIdKey]) {
        live = statusMap[controlIdKey];
      } else if (pinKey && statusMap[pinKey]) {
        live = statusMap[pinKey];
      }
      return {
        ...control,
        state: live?.state || control.state || "UNKNOWN",
        value: live?.value,
        lastUpdated: live?.lastUpdated,
      };
    });
  }, [controls, statusMap]);

  return (
    <div className={`control-status-panel-flat ${!configExpanded ? "sync-collapsed" : ""}`}>
      <div
        className="panel-header"
        onClick={() => setConfigExpanded?.((prev) => !prev)}
        style={{ cursor: setConfigExpanded ? "pointer" : "default" }}
        title={configExpanded ? "Collapse panel" : "Expand panel"}
      >
        <div className="title-block" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h3>📊 Controller Status</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className={`connection ${connected ? "online" : "offline"}`}>
            {connected ? "Connected" : "Disconnected"}
          </span>
          {setConfigExpanded && (
            <span
              className="toggle-icon-btn"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--card-border)",
                cursor: "pointer",
              }}
              title={configExpanded ? "Collapse panel" : "Expand panel"}
            >
              <span
                style={{
                  display: "block",
                  transform: configExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  fontSize: "0.85rem",
                  color: "var(--primary-emerald)",
                  lineHeight: 1,
                }}
              >
                ▼
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="content" onWheel={handleBoundaryWheel}>
        {enrichedControls.length === 0 ? (
          <div className="empty">⚠️ No controllers found for this device.</div>
        ) : (
          <div className="grid">
            {enrichedControls.map((c) => (
              <div key={c.controlId || c.pin || c.name} className="card">
                <div className="card-top">
                  <div className="name">{c.name || c.controlId || "Controller"}</div>
                  <StateBadge state={c.state} />
                </div>
                <div className="meta">
                  <span>Last updated: {formatTime(c.lastUpdated)}</span>
                </div>
                <div className="sensor">
                  <span className="label">Sensor value</span>
                  <span className="value">{c.value ?? "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

ControlStatusPanel.propTypes = {
  configExpanded: PropTypes.bool.isRequired,
  setConfigExpanded: PropTypes.func,
};

export default ControlStatusPanel;
