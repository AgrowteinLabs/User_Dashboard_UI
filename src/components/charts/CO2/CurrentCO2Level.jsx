import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaLeaf } from "react-icons/fa";

const CurrentCO2Level = () => {
  const series = [400]; // Example CO2 level in ppm
  const options = {
    chart: {
      type: 'radialBar',
      animations: {
        enabled: true,
        easing: 'easeout',
        speed: 800,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 15,
          size: '70%',
        },
        dataLabels: {
          value: {
            fontSize: '36px',
            formatter: val => `${val} ppm`,
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
        gradientToColors: ['#A0C334'],
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: 'round',
    },
    labels: ['Current CO2 Level'],
    colors: ['#FEB019'],
  };


  return(
    <div className="progress-bar">
        <div className="progress-bar-info">
          <h4 className="progress-bar-title">
            <FaLeaf style={{ marginRight: "8px" }} />
            Current CO2 Level
          </h4>
        </div>
        <div className="chart-wrapper">
          <ReactApexChart options={options} series={series} type="radialBar" height={350} />
        </div>
      </div>
  );
};

export default CurrentCO2Level;
