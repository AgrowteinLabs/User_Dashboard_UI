import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaTint } from "react-icons/fa";
import "./AreaCharts.scss";


const data = [70, 55, 35, 90, 55, 30, 32]; // Example water levels for the last 7 days

const WaterLevelLast7Days = () => {
  const series = [{
    name: 'Water Level',
    data: data
  }];
  const options = {
    chart: {
      type: 'area',
      height: 350,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 100]
      }
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + '%';
        }
      }
    },
    colors: ['#00E396'],
  };

  return (
    <div className="bar-chart">
      <div className="bar-chart-info">
        <h5 className="bar-chart-title">
          <FaTint style={{ marginRight: "8px" }} />
          Water Level Last 7 Days
        </h5>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="area" height={350} />
      </div>
    </div>
  );
};

export default WaterLevelLast7Days;
