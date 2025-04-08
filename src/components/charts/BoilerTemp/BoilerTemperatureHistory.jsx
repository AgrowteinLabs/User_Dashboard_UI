import { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaChartArea } from "react-icons/fa";
import { ProductContext } from '../../../context/ProductContext';
import { fetchHistoryData } from '../../../api/fetchHistoryData'; // Import the common function
import "../AreaCharts.scss";

const BoilerTemperatureHistory = () => {
  const [series, setSeries] = useState([{ name: 'Boiler Temperature', data: [] }]);
  const [categories, setCategories] = useState([]);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchTemperatureHistory = async () => {
      if (!selectedProductUid) return;

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
      const endDate = new Date().toISOString(); // Current date

      const filteredData = await fetchHistoryData(
        selectedProductUid,
        'Boiler_Temperature',
        startDate,
        endDate
      );

      if (filteredData.length > 0) {
        const temperatures = filteredData.map(entry =>
          parseFloat(entry.data.Boiler_Temperature).toFixed(2) // Format to 2 decimal points
        );
        const timestamps = filteredData.map(entry =>
          new Date(entry.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );

        setSeries([{ name: 'Boiler Temperature', data: temperatures }]);
        setCategories(timestamps);
      }
    };

    fetchTemperatureHistory();
  }, [selectedProductUid]);

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
      curve: 'smooth', // Smooth line curve
      width: 3,
      colors: ['#03856d'], // Line color for Boiler Temperature
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
        formatter: val => `${val}°C`,
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
          Boiler Temperature History (Last 24 Hours)
        </h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="line" height={350} />
      </div>
    </div>
  );
};

export default BoilerTemperatureHistory;
