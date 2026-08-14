import { useCallback, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ProductContext } from "../../context/ProductContext";
import fetchProducts from "../../api/fetchProducts";
import fetchFarmHealth from "../../api/fetchFarmHealth";
import "./FarmHealthCard.scss";

// Status → color + label (backend contract: excellent >=80 / warning 60-79 /
// critical <60). Colors reused for the gauge ring.
const STATUS_META = {
  excellent: { label: "Excellent", color: "#4ade80" },
  warning: { label: "Warning", color: "#fbbf24" },
  critical: { label: "Critical", color: "#f87171" },
};

const Gauge = ({ score, color }) => {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circ - (clamped / 100) * circ;
  return (
    <div className="fh-gauge-wrap" aria-label={`Health score ${score} out of 100`}>
      <svg className="fh-gauge" viewBox="0 0 100 100">
        <circle className="fh-gauge-track" cx="50" cy="50" r={r} />
        <circle
          className="fh-gauge-value"
          cx="50"
          cy="50"
          r={r}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="fh-gauge-score">
        <span className="fh-score-num">{clamped}</span>
        <span className="fh-score-max">/100</span>
      </div>
    </div>
  );
};

Gauge.propTypes = {
  score: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

const FarmHealthCard = () => {
  const { selectedProductUid } = useContext(ProductContext);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [noFarm, setNoFarm] = useState(false);

  const loadHealth = useCallback(async (isActive = () => true) => {
    setLoading(true);
    setError(false);
    setNoFarm(false);

    let uid = selectedProductUid || localStorage.getItem("selectedProductUid");
    if (!uid) {
      const data = await fetchProducts();
      if (!isActive()) return;
      if (Array.isArray(data) && data.length > 0) {
        uid = data[0].uid;
      } else {
        setNoFarm(true);
        setLoading(false);
        return;
      }
    }

    const res = await fetchFarmHealth(uid);
    if (!isActive()) return;
    if (res.error) {
      if (res.status === 404 || res.status === 403) setNoFarm(true);
      else setError(true);
      setHealth(null);
    } else {
      setHealth(res.data);
    }
    setLoading(false);
  }, [selectedProductUid]);

  useEffect(() => {
    let active = true;
    loadHealth(() => active);
    return () => {
      active = false;
    };
  }, [loadHealth]);

  const meta = health ? STATUS_META[health.status] || STATUS_META.warning : null;

  return (
    <div
      className={`farm-health-card${loading ? " loading" : ""}${
        noFarm || error ? " no-data" : ""
      }`}
    >
      {loading && !health ? (
        <div className="fh-empty">
          <span className="fh-icon">🧬</span>
          <span>Loading health…</span>
        </div>
      ) : noFarm || error ? (
        <div className="fh-empty">
          <span className="fh-icon">🧬</span>
          <div className="fh-empty-text">
            <strong>
              {error ? "Health unavailable" : "No health data"}
            </strong>
            <button type="button" className="fh-retry-btn" onClick={loadHealth}>
              ↻ Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <Gauge score={health.score} color={meta.color} />
          <div className="fh-body">
            <div className="fh-title">Farm Health</div>
            <div className="fh-status-row">
              <span className="fh-status" style={{ color: meta.color, borderColor: meta.color }}>
                {meta.label}
              </span>
              <button
                type="button"
                className={`fh-refresh-icon-btn${loading ? " spinning" : ""}`}
                onClick={loadHealth}
                disabled={loading}
                title="Refresh Health"
              >
                ↻
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FarmHealthCard;
