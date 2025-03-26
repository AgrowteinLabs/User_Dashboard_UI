import { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaChartArea } from "react-icons/fa";
import axios from 'axios';  // Added missing import
import { ProductContext } from '../../../context/ProductContext';
import "../AreaCharts.scss";

const PressureHistory = () => {
  const [series, setSeries] = useState([{ name: 'Pressure', data: [] }]);
  const [categories, setCategories] = useState([]);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchPressureHistory = async () => {
      if (!selectedProductUid) return;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/data/${selectedProductUid}/date`,
          {
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
            endDate: new Date().toISOString(), // Current date
          }
        );

        if (response.data && response.data.length > 0) {
          const filteredData = filterByThirtyMinutes(response.data);
          
          const pressureData = filteredData.map(entry =>
            parseFloat(entry.data.Pressure).toFixed(2)
          );

          const timestamps = filteredData.map(entry =>
            new Date(entry.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          );

          setSeries([{ name: 'Pressure', data: pressureData }]);
          setCategories(timestamps);
        }
      } catch (error) {
        console.error('Error fetching pressure history:', error);
      }
    };

    fetchPressureHistory();
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
      height: 350,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 5,
      colors: ['#A0C334'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 7,
      },
    },
    xaxis: {
      categories: categories,
      labels: {
        rotate: -45,
        style: {
          colors: 'var(--text-color)',
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
        text: 'hPa',  // Pressure unit
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
      width: 3,
      colors: ['#A0C334'], 
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.6,
        opacityTo: 0.9,
        stops: [0, 90, 100],
        colorStops: [
          { offset: 0, color: '#A0C334', opacity: 1 },
          { offset: 50, color: '#7CB342', opacity: 0.7 },
          { offset: 100, color: '#558B2F', opacity: 0.4 },
        ],
      },
    },
    tooltip: {
      x: {
        format: 'HH:mm',
      },
      y: {
        formatter: (val) => `${val} hPa`,
      },
      style: {
        fontSize: '12px',
        colors: ['var(--text-color)'],
      },
    },
    grid: {
      borderColor: '#e0e0e0',
    },
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title" style={{ color: 'var(--text-color)' }}>
          <FaChartArea style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          Pressure History (Last 24 Hours)
        </h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="line" height={350} />
      </div>
    </div>
  );
};

export default PressureHistory;
