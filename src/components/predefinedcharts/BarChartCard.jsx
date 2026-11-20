import PropTypes from "prop-types";
import ReactApexChart from "react-apexcharts";
import { useMemo, useRef, useEffect, useState, useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { DARK_THEME } from "../../constants/themeConstants";
import "./BarChartCard.scss";

const BarChartCard = ({ title, value, unit, status = "active", badgeType }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === DARK_THEME;

  // Keep last valid numeric to prevent disappearing labels
  const lastValidValueRef = useRef(null);
  const lastValueRef = useRef(value);
  const [renderKey, setRenderKey] = useState(0);

  // Only force re-render when value actually changes
  useEffect(() => {
    if (lastValueRef.current !== value) {
      lastValueRef.current = value;
      setRenderKey(prev => prev + 1);
    }
  }, [value]);

  const numeric = useMemo(() => {
    const n = Number(value);
    // Ensure we always have a finite number, never NaN
    if (Number.isFinite(n) && n >= 0) {
      lastValidValueRef.current = n;
      return n;
    }
    // Fallback to last valid value or 0
    const fallback = lastValidValueRef.current ?? 0;
    return Number.isFinite(fallback) ? fallback : 0;
  }, [value]);

  // Format value to 0 decimals for display
  const formattedValue = Math.round(numeric);
  const series = useMemo(
    () => [{ name: title, data: [formattedValue] }],
    [title, formattedValue]
  );

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        animations: { 
          enabled: true,
          easing: "easeinout",
          speed: 600,
          animateGradually: { enabled: true, delay: 100 }
        },
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: "40%",
          dataLabels: {
            position: "center",
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val}${unit ? " " + unit : ""}`,
        style: {
          fontSize: "12px",
          fontWeight: "800",
          colors: [isDark ? "#060b13" : "#ffffff"],
          fontFamily: "Plus Jakarta Sans, sans-serif"
        },
      },
      xaxis: {
        categories: ["Current State"],
        labels: { 
          style: { 
            colors: isDark ? "#64748b" : "#94a3b8",
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "Plus Jakarta Sans, sans-serif"
          } 
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        title: {
          text: unit,
          style: { 
            color: isDark ? "#94a3b8" : "#475569",
            fontWeight: 700,
            fontFamily: "Plus Jakarta Sans, sans-serif"
          },
        },
        labels: { 
          style: { 
            colors: isDark ? "#64748b" : "#94a3b8",
            fontWeight: 600,
            fontFamily: "Plus Jakarta Sans, sans-serif"
          } 
        },
      },
      tooltip: {
        theme: isDark ? "dark" : "light",
        y: { formatter: (val) => `${val}${unit ? " " + unit : ""}` },
      },
      fill: { 
        colors: [isDark ? "#00f29b" : "#00b880"] 
      },
      grid: {
        borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)",
        strokeDashArray: 5,
      }
    }),
    [unit, isDark]
  );

  const statusClass = `status-${status}`;

  return (
    <div className={`bar-chart ${statusClass}`}>
      <div className="bar-chart-title">
        <h4>{title}</h4>
        {badgeType === "live" && (
          <span className="chart-badge badge-live">
            <span className="badge-dot" />
            LIVE
          </span>
        )}
      </div>
      <div className="chart-wrapper-center">
        <ReactApexChart
          key={renderKey}
          options={chartOptions}
          series={series}
          type="bar"
          height={312}
          width="100%"
        />
        {/* Value label outside bar for overflow cases */}
        <div
          className="bar-chart-value-label"
          style={{
            fontSize: "14px",
            fontWeight: 800,
            color: isDark ? "#00f29b" : "#00b880",
            marginTop: "10px",
            textAlign: "center",
            fontFamily: "Outfit, sans-serif"
          }}
        >
          {formattedValue}
          {unit ? ` ${unit}` : ""}
        </div>
      </div>
    </div>
  );
};

BarChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  unit: PropTypes.string,
  timestamp: PropTypes.number,
  badgeType: PropTypes.string,
  status: PropTypes.oneOf(["active", "stale", "error", "inactive"]),
};

export default BarChartCard;
