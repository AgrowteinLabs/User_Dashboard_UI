import PropTypes from "prop-types";
import ReactApexChart from "react-apexcharts";
import { useMemo, useRef, useEffect, useState } from "react";
import "./BarChartCard.scss";

const BarChartCard = ({ title, value, unit, status = "active" }) => {
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
    if (Number.isFinite(n)) {
      lastValidValueRef.current = n;
      return n;
    }
    return lastValidValueRef.current ?? 0;
  }, [value]);

  const series = useMemo(
    () => [{ name: title, data: [numeric] }],
    [title, numeric]
  );

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        animations: { enabled: false },
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          borderRadius: 5,
          columnWidth: "30%",
          dataLabels: {
            position: "center", // 👈 put labels inside the bar
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val}${unit ? " " + unit : ""}`,
        style: {
          fontSize: "14px",
          fontWeight: "600",
          colors: ["#fff"], // white text for contrast inside the bar
        },
      },
      xaxis: {
        categories: ["Sensor"],
        labels: { style: { colors: "var(--text-color)" } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        title: {
          text: unit,
          style: { color: "var(--text-color)" },
        },
        labels: { style: { colors: "var(--text-color)" } },
      },
      tooltip: {
        y: { formatter: (val) => `${val}${unit ? " " + unit : ""}` },
      },
      fill: { colors: ["var(--primary-color)"] },
    }),
    [unit]
  );

  const statusClass = `status-${status}`;

  return (
    <div className={`bar-chart ${statusClass}`}>
      <div className="bar-chart-title">
        <h4>{title}</h4>
      </div>
      <div className="chart-wrapper-center">
        <ReactApexChart
          key={renderKey}
          options={chartOptions}
          series={series}
          type="bar"
          height={312}
        />
      </div>
    </div>
  );
};

BarChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  unit: PropTypes.string,
  timestamp: PropTypes.number,
  status: PropTypes.oneOf(["active", "stale", "error", "inactive"]),
};

export default BarChartCard;
