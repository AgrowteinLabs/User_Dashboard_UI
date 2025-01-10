import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaChartArea } from "react-icons/fa";
import { ProductContext } from '../../../context/ProductContext';
import { fetchHistoryData } from '../../../api/fetchHistoryData'; // Import the common function
import "../AreaCharts.scss";

const PressureHistory = () => {
  const [series, setSeries] = useState([{ name: 'Pressure', data: [] }]);
  const [categories, setCategories] = useState([]);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchPressureHistory = async () => {
      if (!selectedProductUid) return;

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
      const endDate = new Date().toISOString(); // Current date

      const filteredData = await fetchHistoryData(
        selectedProductUid,
        'Pressure',
        startDate,
        endDate
      );

      if (filteredData.length > 0) {
        const pressures = filteredData.map(entry =>
          parseFloat(entry.data.Pressure).toFixed(2) // Format to 2 decimal points
        );
        const timestamps = filteredData.map(entry =>
          new Date(entry.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );

        setSeries([{ name: 'Pressure', data: pressures }]);
        setCategories(timestamps);
      }
    };

    fetchPressureHistory();
  }, [selectedProductUid]);

  const options = {
    chart: {
      type: 'line', // Line chart for pressure
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
        text: 'hPa', // Pressure unit
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
      colors: ['#A0C334'], // Line color for Pressure
    },
    markers: {
      size: 5,
      colors: ['#A0C334'],
      strokeColors: 'var(--background-color)',
      strokeWidth: 2,
    },
    tooltip: {
      x: {
        format: 'HH:mm', // Tooltip time format
      },
      y: {
        formatter: val => `${val} hPa`, // Tooltip pressure format
      },
      style: {
        fontSize: '12px',
        colors: ['var(--text-color)'], // Tooltip text color
      },
    },
  };

  return (
    <div className="bar-chart">
      <div className="bar-chart-info">
        <h5 className="bar-chart-title" style={{ color: 'var(--text-color)' }}>
          <FaChartArea style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          Pressure History (Last 24 Hours)
        </h5>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="line" height={350} />
      </div>
    </div>
  );
};

export default PressureHistory;
