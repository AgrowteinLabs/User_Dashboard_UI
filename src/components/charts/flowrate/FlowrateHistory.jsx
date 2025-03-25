import { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaChartArea } from "react-icons/fa";
import axios from 'axios';
import { ProductContext } from '../../../context/ProductContext';
import "../AreaCharts.scss";

const FlowRateHistory = () => {
  const [series, setSeries] = useState([{ name: 'Flow Rate', data: [] }]);
  const [categories, setCategories] = useState([]);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchFlowRateHistory = async () => {
      if (!selectedProductUid) return;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/data/${selectedProductUid}/date`,
          {
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
            endDate: new Date().toISOString(),
          }
        );

        if (response.data && response.data.length > 0) {
          const filteredData = filterByThirtyMinutes(response.data);
          const flowRateData = filteredData.map(entry =>
            parseFloat(entry.data.Flow_Rate).toFixed(2)
          );
          const timestamps = filteredData.map(entry =>
            new Date(entry.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          );

          setSeries([{ name: 'Flow Rate', data: flowRateData }]);
          setCategories(timestamps);
        }
      } catch (error) {
        console.error('Error fetching flow rate history:', error);
      }
    };

    fetchFlowRateHistory();
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
        text: 'L/s', // Assuming Flow Rate is in Liters per second
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
        formatter: (val) => `${val} L/s`, // Liters per second for flow rate
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
          Flow Rate History (Last 24 Hours)
        </h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="area" height={350} />
      </div>
    </div>
  );
};

export default FlowRateHistory;
