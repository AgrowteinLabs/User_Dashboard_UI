import { useEffect, useMemo, useState, useContext, useCallback, useRef } from "react";
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

const formatRelative = (ts) => {
  if (!ts) return "—";
  const then = new Date(ts).getTime();
  if (isNaN(then)) return "—";
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.round(diffH / 24)}d ago`;
};

const StateBadge = ({ state }) => {
  const normalized = (state || "").toString().toUpperCase();
  const className = `state-badge ${normalized === "ON" ? "on" : normalized === "OFF" ? "off" : ""}`;
  return <span className={className}>{normalized || "UNKNOWN"}</span>;
};

StateBadge.propTypes = {
  state: PropTypes.string,
};

const STATUS_META = {
  completed: { label: "✓ Completed", cls: "completed" },
  acknowledged: { label: "✓ Acknowledged", cls: "completed" },
  failed: { label: "✗ Failed", cls: "failed" },
  timeout: { label: "⏱ Timeout", cls: "timeout" },
  pending: { label: "◌ Pending", cls: "pending" },
  queued: { label: "◌ Queued", cls: "pending" },
  executing: { label: "⟳ Executing", cls: "pending" },
};

const StatusChip = ({ status }) => {
  const meta =
    STATUS_META[String(status || "").toLowerCase()] || {
      label: status || "Unknown",
      cls: "pending",
    };
  return <span className={`status-chip ${meta.cls}`}>{meta.label}</span>;
};

StatusChip.propTypes = {
  status: PropTypes.string,
};

const commandLabel = (h) => {
  const cmd = h.command || h.action || "";
  const val = h.value !== undefined && h.value !== null ? ` ${h.value}` : "";
  return `${cmd}${val}`.trim() || "Command";
};

const ControlStatusPanel = ({ configExpanded }) => {
  const { selectedProductUid } = useContext(ProductContext);
  const [controls, setControls] = useState([]);
  const [productId, setProductId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(null);
  const historySeq = useRef(0);
  const { statusMap, connected } = useMqttControllerStatus(selectedProductUid);

  useEffect(() => {
    const fetchControls = async () => {
      if (!selectedProductUid) return;
      try {
        const userId = localStorage.getItem("userId");
        const url = import.meta.env.VITE_REACT_APP_API_URL;
        const res = await fetch(`${url}/api/v1/user/product/${userId}`, { credentials: "include" });
        const data = await res.json();
        const selected = data.find((p) => p.uid === selectedProductUid);
        if (selected) {
          setControls(selected.controls || []);
          setProductId(selected.id || null);
        }
      } catch (err) {
        console.error("Failed to fetch controls for status panel", err);
      }
    };
    fetchControls();
  }, [selectedProductUid]);

  const fetchHistory = useCallback(
    async ({ silent = false } = {}) => {
      if (!productId) return;
      const seq = ++historySeq.current;
      if (!silent) setHistoryLoading(true);
      try {
        const url = import.meta.env.VITE_REACT_APP_API_URL;
        const res = await fetch(
          `${url}/api/v1/products/${productId}/control-history?limit=25`,
          { credentials: "include" }
        );
        const body = await res.json();
        const data = body?.data;
        if (data && seq === historySeq.current) {
          setHistory(Array.isArray(data.history) ? data.history : []);
          setHistoryTotal(data.total ?? data.history?.length ?? 0);
          setRefreshedAt(new Date());
          setHistoryError(false);
        }
      } catch (err) {
        console.error("Failed to fetch command history", err);
        if (seq === historySeq.current) setHistoryError(true);
      } finally {
        if (!silent && seq === historySeq.current) setHistoryLoading(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    if (!productId) return;
    fetchHistory();
    const timer = setInterval(() => fetchHistory({ silent: true }), 8000);
    return () => clearInterval(timer);
  }, [productId, fetchHistory]);

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
      <div className="panel-header">
        <div className="title-block" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h3>📊 Controller Status</h3>
        </div>
        <span className={`connection ${connected ? "online" : "offline"}`}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

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

        <div className="history-section">
          <div className="history-header">
            <h4>📜 Recent commands</h4>
            <button
              className="refresh"
              onClick={() => fetchHistory()}
              disabled={historyLoading}
              type="button"
            >
              {historyLoading ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>
          {refreshedAt && !historyError && (
            <p className="history-meta">
              {historyTotal} command(s) · refreshed {formatRelative(refreshedAt)}
            </p>
          )}
          {historyError ? (
            <div className="empty">
              ⚠️ Couldn&apos;t load command history.
            </div>
          ) : history.length === 0 ? (
            <div className="empty">
              No commands logged.
            </div>
          ) : (
            <ul className="history-list">
              {history.map((h) => {
                const control = (controls || []).find(
                  (c) =>
                    (h.controlId &&
                      normalizeKey(c.controlId) === normalizeKey(h.controlId)) ||
                    (h.pin && normalizeKey(c.pin) === normalizeKey(h.pin))
                );
                return (
                  <li key={h.id} className="history-item">
                    <div className="history-left">
                      <span className="history-control">
                        {control?.name || h.controlId || h.pin || "Controller"}
                      </span>
                      <span className="history-action">{commandLabel(h)}</span>
                    </div>
                    <div className="history-right">
                      <StatusChip status={h.status} />
                      <span className="history-time">
                        {formatRelative(h.timestamp)}
                      </span>
                      {h.deviceFeedback?.received &&
                        Number.isFinite(h.deviceFeedback?.responseTime) && (
                          <span className="history-ack">
                            acked in {(h.deviceFeedback.responseTime / 1000).toFixed(1)}s
                          </span>
                        )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

ControlStatusPanel.propTypes = {
  configExpanded: PropTypes.bool.isRequired,
};

export default ControlStatusPanel;
