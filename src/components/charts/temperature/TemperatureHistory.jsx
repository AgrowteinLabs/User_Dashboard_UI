import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaChartArea } from "react-icons/fa";

const TemperatureHistory = () => {
  const series = [{
    name: 'Temperature',
    data: [22, 21, 23, 24, 22, 21, 20] // Example last 7 days temperature values
  }];
  const options = {
    chart: {
      type: 'area',
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
        text: '°C',
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
      colors: ['var(--primary-color)'], // Use CSS variable for stroke color
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
      },
    },
    tooltip: {
      y: {
        formatter: val => `${val}°C`,
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
          <FaChartArea style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          Temperature History
        </h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="area" height={350} />
      </div>
    </div>
  );
};

export default TemperatureHistory;
