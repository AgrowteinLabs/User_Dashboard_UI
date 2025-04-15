import PropTypes from "prop-types";
import ReactApexChart from "react-apexcharts";

const AreaChartCard = ({ title, data, labels, unit }) => {
  const options = {
    chart: { type: "area" },
    xaxis: {
      categories: labels,
      title: { text: "Time" },
    },
    yaxis: {
      title: { text: unit },
    },
    tooltip: {
      y: { formatter: (val) => `${val} ${unit}` },
    },
    stroke: { curve: "smooth" },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
      },
    },
  };

  const series = [{ name: title, data }];

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4>{title}</h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="area" height={300} />
      </div>
    </div>
  );
};

// ✅ Add PropTypes validation
AreaChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
  unit: PropTypes.string.isRequired,
};

export default AreaChartCard;
