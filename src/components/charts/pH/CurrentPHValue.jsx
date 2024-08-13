import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaFlask } from "react-icons/fa";
import "../AreaCharts.scss";
import { _alignPixel } from 'chart.js/helpers';

const currentPH = 7; // Example pH value

const CurrentPHValue = () => {
  const series = [currentPH];
  const options = {
    chart: {
      type: 'radialBar',
      height: 350,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: {
          margin: 20,
          size: '70%',
          background: 'transparent',
        },
        dataLabels: {
          showOn: 'always',
          name: {
            show: false,
          },
          value: {
            show: true,
            fontSize: '36px',
            fontWeight: 'bold',
            color: 'var(--text-color)', // Use CSS variable for text color
            offsetY: 10,
            formatter: function (val) {
              return val;
            },
          },
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['var(--gradient-color)'], // Gradient end color
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50],
      },
    },
    stroke: {
      lineCap: 'round',
    },
    labels: ['Current pH Value'],
    colors: ['var(--primary-color)'], // Use CSS variable for radial bar color
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title" style={{ color: 'var(--text-color)' }}>
          <FaFlask style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          Current pH Value
        </h4>
      </div>
      <div className="chart-wrapper-center">
        <ReactApexChart options={options} series={series} type="radialBar" height={350} />
      </div>
    </div>
  );
};

export default CurrentPHValue;
