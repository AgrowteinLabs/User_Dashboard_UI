import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaLeaf } from "react-icons/fa";
import "../AreaCharts.scss"

const CO2History = () => {
  const series = [{
    name: 'CO2 Level',
    data: [410, 400, 405, 390, 420, 415, 398] // Example last 7 days CO2 values
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
        text: 'ppm',
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
      colors: ['#A0C334'],
      strokeColors: '#fff',
      strokeWidth: 2,
    },
    tooltip: {
      y: {
        formatter: val => `${val} ppm`,
      },
      style: {
        fontSize: '12px',
        fontFamily: undefined,
        colors: ['var(--text-color)'], // Tooltip text color for dark mode
      },
    },
  };

  return(
    <div className="bar-chart">
      <div className="bar-chart-info">
        <h5 className="bar-chart-title" style={{ color: 'var(--text-color)' }}>
          <FaLeaf style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          CO2 Level History
        </h5>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="line" height={350} />
      </div>
    </div>
  );
};

export default CO2History;
