import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaChartArea } from "react-icons/fa";
import axios from 'axios';
import { ProductContext } from '../../../context/ProductContext';
import "../AreaCharts.scss";

const ElectricConductivityHistory = () => {
  const [series, setSeries] = useState([{ name: 'Electric Conductivity', data: [] }]);
  const [categories, setCategories] = useState([]);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchConductivityHistory = async () => {
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
          const conductivities = filteredData.map(entry =>
            parseFloat(entry.data.Electric_Conductivity).toFixed(2) // Format to 2 decimal points
          );
          const timestamps = filteredData.map(entry =>
            new Date(entry.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          );
    
          setSeries([{ name: 'Electric Conductivity', data: conductivities }]);
          setCategories(timestamps);
        } else {
          console.error('No conductivity data available for the selected date range.');
        }
      } catch (error) {
        console.error('Error fetching conductivity history:', error);
      }
    };

    fetchConductivityHistory();
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
      type: 'line', // Change to line chart
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: 'var(--text-color)', // Use CSS variable for text color
        },
      },
      tickAmount: 'dataPoints',
      title: {
        text: 'Time (Last 24 Hours)',
        style: {
          color: 'var(--text-color)',
        },
      },
    },
    yaxis: {
      title: {
        text: 'µS/cm', // Electric Conductivity units (microsiemens per centimeter or other units)
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
      curve: 'smooth', // Smooth line curve
      width: 3,
      colors: ['#03856d'], // Line color for Electric Conductivity
    },
    fill: {
      type: 'gradient', // Use gradient fill
      gradient: {
        shade: 'light', // Light or dark gradient shade
        type: 'horizontal', // Horizontal gradient
        shadeIntensity: 0.5,
        gradientToColors: ['#81c784'], // Color at the end of the gradient
        opacityFrom: 0.5, // Initial opacity
        opacityTo: 0, // Final opacity
        stops: [0, 100], // Gradient stops
      },
    },
    markers: {
      size: 5,
      colors: ['#4caf50'],
      strokeColors: 'var(--background-color)',
      strokeWidth: 2,
    },
    tooltip: {
      y: {
        formatter: val => `${val} µS/cm`, // Format tooltip with Electric Conductivity unit
      },
      style: {
        fontSize: '12px',
        colors: ['var(--text-color)'],
      },
    },
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title" style={{ color: 'var(--text-color)' }}>
          <FaChartArea style={{ marginRight: '8px', color: 'var(--text-color)' }} />
          Electric Conductivity History (Last 24 Hours)
        </h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="line" height={350} />
      </div>
    </div>
  );
};

export default ElectricConductivityHistory;
