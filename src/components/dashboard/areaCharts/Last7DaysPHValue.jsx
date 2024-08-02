import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaFlask } from "react-icons/fa";
import "./AreaCharts.scss";

const data = [7.0, 6.8, 7.2, 7.1, 7.0, 7.3, 7.2]; // Example pH values for the last 7 days

const Last7DaysPHValue = () => {
  const series = [
    {
      name: 'pH Value',
      data: data,
    },
  ];

  const options = {
    chart: {
      type: 'line',
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
    markers: {
      size: 6,
      colors: ['#FFA41B'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 8,
      },
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    yaxis: {
      min: 6.5,
      max: 7.5,
      tickAmount: 5,
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => `${val.toFixed(1)}`,
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
    colors: ['#00E396'],
  };

  return (
    <div className="bar-chart">
      <div className="bar-chart-info">
        <h5 className="bar-chart-title">
          <FaFlask style={{ marginRight: "8px" }} />
          Last 7 Days pH Value
        </h5>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="line" height={350} />
      </div>
    </div>
  );
};

export default Last7DaysPHValue;
