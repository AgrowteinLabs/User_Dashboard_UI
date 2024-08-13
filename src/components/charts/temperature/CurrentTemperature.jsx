import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaThermometerHalf } from "react-icons/fa";

const CurrentTemperature = () => {
  const series = [{ name: 'Temperature', data: [23] }]; // Example current temperature value
  const options = {
    chart: {
      type: 'line',
      animations: {
        enabled: true,
        easing: 'easeout',
        speed: 800,
      },
    },
    xaxis: {
      categories: ['Current'],
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
      width: 8,
      curve: 'smooth',
      colors: ['var(--primary-color)'], // Use CSS variable for stroke color
    },
    markers: {
      size: 8,
      colors: ['var(--primary-color)'], // Marker color
      strokeColors: 'var(--background-color)', // Adjust for light or dark background
      strokeWidth: 2,
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
          <FaThermometerHalf style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          Current Temperature
        </h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="line" height={350} />
      </div>
    </div>
  );
};

export default CurrentTemperature;
