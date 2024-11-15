import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaLeaf } from "react-icons/fa";
import axios from 'axios';
import { ProductContext } from '../../../context/ProductContext'; 
import "../AreaCharts.scss";

const CO2History = () => {
  const [series, setSeries] = useState([{ name: 'CO2 Level', data: [] }]);
  const [categories, setCategories] = useState([]);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchCO2History = async () => {
      if (!selectedProductUid) return;

      try {
        const response = await axios.post(`https://agrowtein-5u7w.onrender.com/api/v1/data/${selectedProductUid}/date`, {
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
          endDate: new Date().toISOString() // current date
        });

        if (response.data && response.data.length > 0) {
          const filteredData = filterByThirtyMinutes(response.data);
          const co2Levels = filteredData.map(entry => entry.data.Co2);
          const timestamps = filteredData.map(entry => new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
          
          setSeries([{ name: 'CO2 Level', data: co2Levels }]);
          setCategories(timestamps);
        } else {
          console.error("No data available for the selected date range.");
        }
      } catch (error) {
        console.error("Error fetching CO2 history:", error);
      }
    };

    fetchCO2History();
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
      type: 'line',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    xaxis: {
      categories: categories,
      labels: {
        rotate: -45, // Rotates labels to prevent overlap
        datetimeFormatter: {
          hour: 'HH:mm' // Use a 24-hour time format, or 'hh:mm A' for 12-hour format
        },
        style: {
          colors: 'var(--text-color)',
        },
      },
      tickAmount: 'dataPoints', // Adjusts tick amount dynamically
      title: {
        text: 'Time',
        style: {
          color: 'var(--text-color)',
        },
      }
    },
    yaxis: {
      title: {
        text: 'ppm',
        style: {
          color: 'var(--text-color)',
        },
      },
      labels: {
        style: {
          colors: 'var(--text-color)',
        },
      },
    },
    stroke: {
      curve: 'smooth',
      colors: ['var(--primary-color)'],
    },
    markers: {
      size: 5,
      colors: ['#A0C334'],
      strokeColors: '#fff',
      strokeWidth: 2,
    },
    tooltip: {
      x: {
        format: 'HH:mm' // Tooltip format
      },
      y: {
        formatter: val => `${val} ppm`,
      },
      style: {
        fontSize: '12px',
        colors: ['var(--text-color)'],
      },
    },
  };

  
  return (
    <div className="bar-chart">
      <div className="bar-chart-info">
        <h5 className="bar-chart-title" style={{ color: 'var(--text-color)' }}>
          <FaLeaf style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          CO2 Level History (Last 24 Hours)
        </h5>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="line" height={350} />
      </div>
    </div>
  );
};

export default CO2History;
