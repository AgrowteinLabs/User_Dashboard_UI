import PropTypes from "prop-types";
import ReactApexChart from "react-apexcharts";
import { useMemo, useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { DARK_THEME } from "../../constants/themeConstants";
import "./AreaChartCard.scss";

const AreaChartCard = ({ title, data, labels, unit, badgeType }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === DARK_THEME;

  // Filter out NaN and invalid values to prevent transform errors
  const sanitizedData = useMemo(() => {
    return data.map(val => {
      const num = Number(val);
      return Number.isFinite(num) ? num : 0;
    });
  }, [data]);

  const sanitizedLabels = useMemo(() => {
    return labels && labels.length > 0 ? labels : Array.from({ length: sanitizedData.length }, (_, i) => `Point ${i + 1}`);
  }, [labels, sanitizedData]);

  const options = useMemo(() => ({
    chart: {
      type: "area",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      animations: { 
        enabled: true,
        easing: "easeinout",
        speed: 800,
        animateGradually: { enabled: true, delay: 150 },
        dynamicAnimation: { enabled: true, speed: 350 }
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        },
      },
    },
    xaxis: {
      categories: sanitizedLabels,
      title: { 
        text: "Time", 
        style: { 
          color: isDark ? "#94a3b8" : "#475569",
          fontWeight: 700,
          fontSize: "11px"
        } 
      },
      labels: { 
        style: { 
          colors: isDark ? "#64748b" : "#94a3b8",
          fontSize: "10px",
          fontWeight: 600
        } 
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      title: { 
        text: unit, 
        style: { 
          color: isDark ? "#94a3b8" : "#475569",
          fontWeight: 700,
          fontSize: "11px"
        } 
      },
      labels: { 
        style: { 
          colors: isDark ? "#64748b" : "#94a3b8",
          fontSize: "10px",
          fontWeight: 600
        } 
      },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      x: { show: true },
      y: { formatter: (val) => `${val} ${unit}` },
    },
    stroke: {
      curve: "smooth",
      width: 3.5,
      colors: [isDark ? "#00f29b" : "#00b880"],
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: isDark ? "dark" : "light",
        type: "vertical",
        shadeIntensity: 0.5,
        gradientToColors: [isDark ? "#00e5ff" : "#00b880"],
        inverseColors: false,
        opacityFrom: isDark ? 0.35 : 0.5,
        opacityTo: 0.02,
        stops: [0, 95, 100],
      },
    },
    grid: {
      borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)",
      strokeDashArray: 5,
    },
    colors: [isDark ? "#00f29b" : "#00b880"],
  }), [sanitizedLabels, unit, isDark]);

  const series = useMemo(() => [{ name: title, data: sanitizedData }], [title, sanitizedData]);

  return (
    <div className="area-chart">
      <div className="bar-chart-title">
        <h4>{title}</h4>
        {badgeType === "history" && (
          <span className="chart-badge badge-history">HISTORY</span>
        )}
      </div>
      <div className="chart-wrapper-center">
        <ReactApexChart options={options} series={series} type="area" height={312} width="100%" />
      </div>
    </div>
  );
};

AreaChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
  unit: PropTypes.string.isRequired,
  badgeType: PropTypes.string,
};

export default AreaChartCard;
