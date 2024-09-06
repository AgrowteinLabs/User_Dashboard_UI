import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaTint } from "react-icons/fa";
import CircularProgress from '@mui/material/CircularProgress';
import "./AreaCharts.scss";

const HumidityLast7Days = () => {
  const [loading, setLoading] = useState(true);

  // Hardcoded humidity data for the last 7 days (example values)
  const humidityData = [60, 65, 55, 70, 68, 72, 66]; // Example humidity percentages for 7 days
  const dates = [
    '2024-09-01',
    '2024-09-02',
    '2024-09-03',
    '2024-09-04',
    '2024-09-05',
    '2024-09-06',
    '2024-09-07'
  ]; // Dates corresponding to the last 7 days

  useEffect(() => {
    setLoading(false); // Simulate loading completion
  }, []);

  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const series = [{
    name: 'Humidity',
    data: humidityData
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
      zoom: {
        enabled: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
    },
    xaxis: {
      categories: dates, // Use hardcoded dates as categories
      labels: {
        show: true,
        rotate: -45,
        datetimeUTC: false,
        style: {
          fontSize: '12px',
          colors: isDarkMode ? '#fff' : '#000',
        }
      },
      title: {
        text: 'Date',
        style: {
          color: isDarkMode ? '#fff' : '#000', // X-axis title color based on dark mode
        }
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      title: {
        text: 'Humidity (%)',
        style: {
          color: isDarkMode ? '#fff' : '#000', // Y-axis title color based on dark mode
        },
      },
      labels: {
        style: {
          colors: isDarkMode ? '#fff' : '#000', // Y-axis labels color based on dark mode
        }
      }
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
      x: {
        format: 'dd MMM yyyy' // Format for date in tooltip
      },
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
          Humidity History
        </h5>
      </div>
      <div className="chart-wrapper">
        {loading ? (
          <CircularProgress />
        ) : (
          <ReactApexChart options={options} series={series} type="area" height={350} />
        )}
      </div>
    </div>
  );
};

export default HumidityLast7Days;
