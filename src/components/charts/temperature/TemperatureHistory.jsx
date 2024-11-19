import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaChartArea } from "react-icons/fa";
import axios from 'axios';
import { ProductContext } from '../../../context/ProductContext';
import "../AreaCharts.scss";

const TemperatureHistory = () => {
  const [series, setSeries] = useState([{ name: 'Temperature', data: [] }]);
  const [categories, setCategories] = useState([]);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchTemperatureHistory = async () => {
      if (!selectedProductUid) return;
    
      try {
        const response = await axios.post(
          `https://agrowtein-5u7w.onrender.com/api/v1/data/${selectedProductUid}/date`,
          {
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
            endDate: new Date().toISOString(), // Current date
          }
        );
    
        if (response.data && response.data.length > 0) {
          const filteredData = filterByThirtyMinutes(response.data);
          const temperatures = filteredData.map(entry =>
            parseFloat(entry.data.Temperature).toFixed(2) // Format to 2 decimal points
          );
          const timestamps = filteredData.map(entry =>
            new Date(entry.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          );
    
          setSeries([{ name: 'Temperature', data: temperatures }]);
          setCategories(timestamps);
        } else {
          console.error('No temperature data available for the selected date range.');
        }
      } catch (error) {
        console.error('Error fetching temperature history:', error);
      }
    };    

    fetchTemperatureHistory();
  }, [selectedProductUid]);

  const filterByThirtyMinutes = (data) => {
    const result = [];
    let lastTimestamp = null;

    data.forEach((entry) => {
      const entryTime = new Date(entry.timestamp);
      if (!lastTimestamp || entryTime - lastTimestamp >= 30 * 60 * 1000) {
        result.push(entry);
        lastTimestamp = entryTime;
      }
    });

    return result;
  };

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
      categories: categories,
      labels: {
        rotate: -45, // Rotate labels to prevent overlap
        style: {
          colors: 'var(--text-color)', // Use CSS variable for text color
        },
      },
      tickAmount: 'dataPoints', // Adjust tick amount dynamically
      title: {
        text: 'Time',
        style: {
          color: 'var(--text-color)', // Axis title color
        },
      },
    },
    yaxis: {
      title: {
        text: '°C',
        style: {
          color: 'var(--text-color)', // Axis title color
        },
      },
      labels: {
        style: {
          colors: 'var(--text-color)', // Label color
        },
      },
    },
    stroke: {
      curve: 'smooth',
      colors: ['var(--primary-color)'], // Line color
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
      x: {
        format: 'HH:mm', // Tooltip time format
      },
      y: {
        formatter: val => `${val}°C`, // Tooltip temperature format
      },
      style: {
        fontSize: '12px',
        colors: ['var(--text-color)'], // Tooltip text color
      },
    },
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title" style={{ color: 'var(--text-color)' }}>
          <FaChartArea style={{ marginRight: '8px', color: 'var(--text-color)' }} />
          Temperature History (Last 24 Hours)
        </h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="area" height={350} />
      </div>
    </div>
  );
};

export default TemperatureHistory;
