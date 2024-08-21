import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaWater } from "react-icons/fa";
import "./AreaCharts.scss";

const CurrentWaterLevel = () => {
  const series = [70]; // Example water level percentage
  const options = {
    chart: {
      type: 'radialBar',
      height: 350,
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: '70%',
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            show: true,
            fontSize: '22px',
            fontWeight: 600,
            color: '#000',
            formatter: function (val) {
              return val + '%';
            },
          },
        },
      },
    },
    fill: {
      colors: ['#00E396'],
    },
    stroke: {
      lineCap: 'round',
    },
    labels: ['Current Water Level'],
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title">
          <FaWater style={{ marginRight: "8px" }} />
          Current Water Level
        </h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="radialBar" height={350} />
      </div>
    </div>
  );
};

export default CurrentWaterLevel;
