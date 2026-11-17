import { useCallback, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ProductContext } from "../../context/ProductContext";
import fetchProducts from "../../api/fetchProducts";
import fetchFarmHealth from "../../api/fetchFarmHealth";
import {
  getFarmHealthMode,
  FARM_HEALTH_MODES,
} from "../../constants/featureFlags";
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
  const mode = getFarmHealthMode();
  const isComingSoon = mode === FARM_HEALTH_MODES.COMING_SOON;
  const isHidden = mode === FARM_HEALTH_MODES.HIDDEN;
  const isActive = mode === FARM_HEALTH_MODES.ACTIVE;

  const { selectedProductUid } = useContext(ProductContext);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(isActive);
  const [error, setError] = useState(false);
  const [noFarm, setNoFarm] = useState(false);

  const loadHealth = useCallback(
    async (isMounted = () => true) => {
      if (!isActive) return;
      setLoading(true);
      setError(false);
      setNoFarm(false);

      let uid = selectedProductUid || localStorage.getItem("selectedProductUid");
      if (!uid) {
        const data = await fetchProducts();
        if (!isMounted()) return;
        if (Array.isArray(data) && data.length > 0) {
          uid = data[0].uid;
        } else {
          setNoFarm(true);
          setLoading(false);
          return;
        }
      }

      const res = await fetchFarmHealth(uid);
      if (!isMounted()) return;
      if (res.error) {
        if (res.status === 404 || res.status === 403) setNoFarm(true);
        else setError(true);
        setHealth(null);
      } else {
        setHealth(res.data);
      }
      setLoading(false);
    },
    [isActive, selectedProductUid]
  );

  useEffect(() => {
    if (!isActive) return;
    let active = true;
    loadHealth(() => active);
    return () => {
      active = false;
    };
  }, [isActive, loadHealth]);

  if (isHidden) {
    return null;
  }

  if (isComingSoon) {
    return (
      <div
        className="farm-health-card coming-soon"
        title="Rule-based calculation deferred. Dedicated AI/ML prediction model launching in Phase 2."
      >
        <div className="fh-ai-wrap" aria-label="Phase 2 AI Model In Training">
          <div className="fh-ai-orb">
            <svg
              className="fh-ai-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="fh-ai-glow-pulse" />
          </div>
        </div>

        <div className="fh-body">
          <div className="fh-title-wrap">
            <div className="fh-title">Farm Health Score</div>
            <span className="fh-phase-pill">Phase 2</span>
          </div>

          <div className="fh-status-row">
            <span className="fh-status fh-status-training">
              <span className="fh-pulsing-dot" />
              AI Model in Training
            </span>
          </div>

          <div className="fh-subtext">
            Calibrating dedicated ML model for real-world farm conditions
          </div>
        </div>
      </div>
    );
  }

  // Active mode with live rule-based calculation
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
