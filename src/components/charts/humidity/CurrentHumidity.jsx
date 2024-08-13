import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaTint } from "react-icons/fa";

const CurrentHumidity = () => {
  const series = [{ name: 'Humidity', data: [60] }]; // Example current humidity percentage
  const options = {
    chart: {
      type: 'bar',
      animations: {
        enabled: true,
        easing: 'bounce',
        speed: 1000,
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
        text: '%',
        style: {
          color: 'var(--text-color)', // Use CSS variable for text color
        },
      },
      labels: {
        style: {
          colors: 'var(--text-color)', // Use CSS variable for text color
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
      },
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
    colors: ['var(--primary-color)'], // Use CSS variable for the bar color
  };

  return(
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title" style={{ color: 'var(--text-color)' }}>
          <FaTint style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          Current Humidity
        </h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="bar" height={350} />
      </div>
    </div>
  );
};

export default CurrentHumidity;
