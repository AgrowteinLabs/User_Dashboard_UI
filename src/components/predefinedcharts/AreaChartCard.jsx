import PropTypes from "prop-types";
import ReactApexChart from "react-apexcharts";

const AreaChartCard = ({ title, data, labels, unit }) => {
  const options = {
    chart: {
      type: "area",
      fontFamily: "inherit",
      toolbar: { show: false },
    },
    xaxis: {
      categories: labels,
      title: { text: "Time", style: { color: "#555" } },
      labels: { style: { colors: "#777" } },
    },
    yaxis: {
      title: { text: unit, style: { color: "#555" } },
      labels: { style: { colors: "#777" } },
    },
    tooltip: {
      theme: "light",
      y: { formatter: (val) => `${val} ${unit}` },
    },
    stroke: {
      curve: "smooth",
      width: 3,
      colors: ["#03856d"],
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.4,
        gradientToColors: ["#03c49e"],
        inverseColors: false,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    grid: {
      borderColor: "#e0e0e0",
      strokeDashArray: 5,
    },
    colors: ["#03856d"],
  };

  const series = [{ name: title, data }];

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4>{title}</h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="area" height={320} />
      </div>
    </div>
  );
};

AreaChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
  unit: PropTypes.string.isRequired,
};

export default AreaChartCard;
