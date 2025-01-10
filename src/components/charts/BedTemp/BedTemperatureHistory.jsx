import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaChartArea } from "react-icons/fa";
import { ProductContext } from '../../../context/ProductContext';
import { fetchHistoryData } from '../../../api/fetchHistoryData'; // Import the common function
import "../AreaCharts.scss";

const BedTemperatureHistory = () => {
  const [series, setSeries] = useState([{ name: 'Bed Temperature', data: [] }]);
  const [categories, setCategories] = useState([]);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchTemperatureHistory = async () => {
      if (!selectedProductUid) return;

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
      const endDate = new Date().toISOString(); // Current date

      const filteredData = await fetchHistoryData(
        selectedProductUid,
        'Bed_Temperature',
        startDate,
        endDate
      );

      if (filteredData.length > 0) {
        const temperatures = filteredData.map(entry =>
          parseFloat(entry.data.Bed_Temperature).toFixed(2) // Format to 2 decimal points
        );
        const timestamps = filteredData.map(entry =>
          new Date(entry.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );

        setSeries([{ name: 'Bed Temperature', data: temperatures }]);
        setCategories(timestamps);
      }
    };

    fetchTemperatureHistory();
  }, [selectedProductUid]);

  const options = {
    chart: {
      type: 'area', // Spline area chart
      height: 350,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    dataLabels: {
      enabled: false, // Disable data labels for a cleaner look
    },
    markers: {
      size: 6,
      colors: ['#03856d'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 8,
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
        text: '°C',
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
      curve: 'smooth', // Smooth spline curve
      width: 3,
      colors: ['#03856d'], // Line color matching primary color
    },
    fill: {
      type: 'gradient', // Gradient fill for area chart
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.6,
        opacityTo: 0.9,
        stops: [0, 90, 100],
        colorStops: [
          { offset: 0, color: '#03856d', opacity: 1 },
          { offset: 50, color: '#00b3a6', opacity: 0.7 },
          { offset: 100, color: '#00e0d1', opacity: 0.4 },
        ],
      },
    },
    tooltip: {
      x: {
        format: 'dd/MM/yy HH:mm',
      },
      y: {
        formatter: (val) => `${val}°C`,
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
          <FaChartArea style={{ marginRight: '8px', color: 'var(--text-color)' }} />
          Bed Temperature History (Last 24 Hours)
        </h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="area" height={350} />
      </div>
    </div>
  );
};

export default BedTemperatureHistory;
