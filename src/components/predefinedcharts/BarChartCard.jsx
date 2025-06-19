import PropTypes from "prop-types";
import ReactApexChart from "react-apexcharts";
import { useMemo } from "react";
import "./BarChartCard.scss";

const BarChartCard = ({ title, value, unit, status = "active" }) => {
  const chartOptions = useMemo(() => ({
    chart: {
      type: "bar",
      animations: {
        enabled: false, // Disabled to reduce layout jank
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 5,
        horizontal: false,
        columnWidth: "30%",
      },
    },
    xaxis: {
      categories: ["Sensor"],
      labels: {
        style: { colors: "var(--text-color)" },
      },
    },
    yaxis: {
      title: {
        text: unit,
        style: { color: "var(--text-color)" },
      },
      labels: {
        style: { colors: "var(--text-color)" },
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} ${unit}`,
      },
    },
    fill: {
      colors: ["var(--primary-color)"],
    },
  }), [unit]);

  const series = useMemo(() => [
    { name: title, data: [parseFloat(value)] }
  ], [title, value]);

  const statusClass = `status-${status}`;

  return (
    <div className={`bar-chart ${statusClass}`}>
      <div className="bar-chart-title">
        <h4>{title}</h4>
      </div>
      <div className="chart-wrapper-center">
        <ReactApexChart
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
