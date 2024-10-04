import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaTint } from "react-icons/fa";
import axios from 'axios';
import { ProductContext } from '../../../context/ProductContext'; 
import "./AreaCharts.scss";

const HumidityHistory = () => {
  const [series, setSeries] = useState([{ name: 'Humidity', data: [] }]);
  const [categories, setCategories] = useState([]);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchHumidityHistory = async () => {
      if (!selectedProductUid) return;

      try {
        const response = await axios.post(`https://agrowtein-5u7w.onrender.com/api/v1/data/${selectedProductUid}/date`, {
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
          endDate: new Date().toISOString() // current date
        });

        if (response.data && response.data.length > 0) {
          const filteredData = filterByThirtyMinutes(response.data);
          const humidityLevels = filteredData.map(entry => entry.data.Humidity);
          const timestamps = filteredData.map(entry => new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
          
          setSeries([{ name: 'Humidity', data: humidityLevels }]);
          setCategories(timestamps);
        } else {
          console.error("No data available for the selected date range.");
        }
      } catch (error) {
        console.error("Error fetching humidity history:", error);
      }
    };

    fetchHumidityHistory();
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
        style: {
          colors: 'var(--text-color)',
        }
      }
    },
    yaxis: {
      title: {
        text: '%',
        style: {
          color: 'var(--text-color)',
        },
      },
      labels: {
        style: {
          colors: 'var(--text-color)',
        }
      }
    },
    stroke: {
      curve: 'smooth',
      colors: ['var(--primary-color)'],
    },
    markers: {
      size: 5,
      colors: ['var(--primary-color)'],
      strokeColors: 'var(--background-color)',
      strokeWidth: 2,
    },
    tooltip: {
      y: {
        formatter: val => `${val}%`,
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
          <FaTint style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          Humidity History (Last 24 Hours)
        </h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="line" height={350} />
      </div>
    </div>
  );
};

export default HumidityHistory;
