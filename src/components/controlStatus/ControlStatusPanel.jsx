import { useEffect, useMemo, useState, useContext } from "react";
import PropTypes from "prop-types";
import { ProductContext } from "../../context/ProductContext";
import { useMqttControllerStatus } from "../../hooks/useMqttControllerStatus";
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

const ControlStatusPanel = () => {
  const { selectedProductUid } = useContext(ProductContext);
  const [controls, setControls] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const { statusMap, connected } = useMqttControllerStatus(selectedProductUid);

  useEffect(() => {
    const fetchControls = async () => {
      if (!selectedProductUid) return;
      try {
        const userId = localStorage.getItem("userId");
        const url = import.meta.env.VITE_REACT_APP_API_URL;
        const res = await fetch(`${url}/api/v1/user/product/${userId}`);
        const data = await res.json();
        const selected = data.find((p) => p.uid === selectedProductUid);
        if (selected?.controls) {
          console.log("🔧 Controls from backend:", selected.controls);
          setControls(selected.controls);
        }
      } catch (err) {
        console.error("Failed to fetch controls for status panel", err);
      }
    };
    fetchControls();
  }, [selectedProductUid]);

  // Auto-close panel after 30 seconds
  useEffect(() => {
    let timer;
    if (isOpen) {
      timer = setTimeout(() => {
        setIsOpen(false);
      }, 30000);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  const enrichedControls = useMemo(() => {
    return (controls || []).map((control) => {
      // Try matching by controlId first, then by pin separately
      const controlIdKey = normalizeKey(control.controlId);
      const pinKey = normalizeKey(control.pin);

      let live = null;
      let matchedVia = null;

      if (controlIdKey && statusMap[controlIdKey]) {
        live = statusMap[controlIdKey];
        matchedVia = "controlId";
      } else if (pinKey && statusMap[pinKey]) {
        live = statusMap[pinKey];
        matchedVia = "pin";
      }

      console.log(`🔍 Matching control:`, {
        name: control.name,
        controlId: control.controlId,
        pin: control.pin,
        normalizedControlId: controlIdKey,
        normalizedPin: pinKey,
        matchedVia,
        found: !!live,
        state: live?.state
      });

      return {
        ...control,
        state: live?.state || control.state || "UNKNOWN",
        value: live?.value,
        lastUpdated: live?.lastUpdated,
      };
    });
  }, [controls, statusMap]);

  return (
    <div className="control-status-panel">
      <button
        className="header"
        onClick={() => setIsOpen((v) => !v)}
        type="button"
      >
        <div className="title-block">
          <span className="chevron">{isOpen ? "▾" : "▸"}</span>
          <div>
            <h3>📊 Controller Status</h3>
            {/* <p>Live status</p> */}
          </div>
        </div>
        <span className={`connection ${connected ? "online" : "offline"}`}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </button>

      {isOpen && (
        <div className="content">
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
                    <span>Pin: {c.pin ?? "—"}</span>
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
      )}
    </div>
  );
};

export default ControlStatusPanel;