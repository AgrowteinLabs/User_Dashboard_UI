import PropTypes from "prop-types";
import ReactApexChart from "react-apexcharts";

const BarChartCard = ({ title, value, unit }) => {
  const options = {
    chart: { type: "bar" },
    xaxis: { categories: ["Sensor"], title: { text: "Sensor" } },
    yaxis: { title: { text: unit } },
    tooltip: {
      y: { formatter: (val) => `${val} ${unit}` },
    },
  };

  const series = [{ name: title, data: [value] }];

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4>{title}</h4>
      </div>
      <div className="chart-wrapper-c">
        <ReactApexChart options={options} series={series} type="bar" height={300} />
      </div>
    </div>
  );
};

// ✅ Add PropTypes validation
BarChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string.isRequired,
};

export default BarChartCard;
