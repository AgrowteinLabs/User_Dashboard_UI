import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaTint } from "react-icons/fa";
import "../AreaCharts.scss";

const HumidityHistory = () => {
  const series = [{
    name: 'Humidity',
    data: [55, 60, 58, 62, 61, 59, 57] // Example last 7 days humidity values
  }];
  const options = {
    chart: {
      type: 'line',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      labels: {
        style: {
          colors: 'var(--text-color)', // Use CSS variable for text color
        }
      }
    },
    yaxis: {
      title: {
        text: '%',
        style: {
          color: 'var(--text-color)', // Use CSS variable for axis title color
        },
      },
      labels: {
        style: {
          colors: 'var(--text-color)', // Use CSS variable for text color
        }
      }
    },
    stroke: {
      curve: 'smooth',
      colors: ['var(--primary-color)'], // Use CSS variable for line color
    },
    markers: {
      size: 5,
      colors: ['var(--primary-color)'], // Marker color
      strokeColors: 'var(--background-color)', // Adjust for light or dark background
      strokeWidth: 2,
    },
    tooltip: {
      y: {
        formatter: val => `${val}%`,
      },
      style: {
        fontSize: '12px',
        fontFamily: undefined,
        colors: ['var(--text-color)'], // Tooltip text color for dark mode
      },
    },
  };

  return(
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title" style={{ color: 'var(--text-color)' }}>
          <FaTint style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          Humidity History
        </h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="line" height={350} />
      </div>
    </div>
  );
};

export default HumidityHistory;
