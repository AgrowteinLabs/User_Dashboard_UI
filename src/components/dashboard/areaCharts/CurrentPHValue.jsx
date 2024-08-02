import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaFlask } from "react-icons/fa";
import "./AreaCharts.scss";

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
          margin: 15,
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
            color: '#000',
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
        gradientToColors: ['#ABE5A1'],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: 'round',
    },
    labels: ['Current pH Value'],
    colors: ['#FEB019'],
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title">
          <FaFlask style={{ marginRight: "8px" }} />
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
