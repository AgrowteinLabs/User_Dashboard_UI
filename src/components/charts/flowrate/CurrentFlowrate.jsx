import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaArrowDown } from "react-icons/fa";  // Use a suitable icon for Flow Rate
import { fetcheddata } from '../../dashboard/api/fetchdata'; 
import { ProductContext } from '../../../context/ProductContext';
import '../AreaCharts.scss';

const FlowRateCurrent = () => {
  const [series, setSeries] = useState([0]); 
  const [error, setError] = useState(false);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchFlowRateData = async () => {
      if (!selectedProductUid) return;

      try {
        const data = await fetcheddata(selectedProductUid);

        if (data && data.data) {
          const flowRate = data.data.Flow_Rate;
          const serverTimestamp = new Date(data.timestamp).getTime(); 
          const currentTime = Date.now();
    
          // Check if the data is valid
          if (flowRate === "_" || isNaN(flowRate)) {
            setError(true); // Invalid or missing Flow Rate, set error state
            return;
          }

          const formattedFlowRate = parseFloat(flowRate).toFixed(2);

          // Check if the data is fresh (within 30 minutes)
          if (currentTime - serverTimestamp <= 30 * 60 * 1000) {
            setSeries([formattedFlowRate]);
            setError(false);
          } else {
            setError(true);
          }
        }
      } catch (error) {
        setError(true); // Error fetching data
      }
    };

    fetchFlowRateData();
    const intervalId = setInterval(fetchFlowRateData, 1000); // Polling every second
    return () => clearInterval(intervalId); 
  }, [selectedProductUid]);

  const options = {
    chart: {
      type: 'bar',
      animations: {
        enabled: true,
        easing: 'easeout',
        speed: 800,
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 20,
        horizontal: false,
        columnWidth: '30%',
        colors: {
          backgroundBarOpacity: 1,
          backgroundBarRadius: 5,
          ranges: [{ from: 0, to: 100, color: 'var(--primary-color)' }], // Modify as needed
        },
      },
    },
    xaxis: {
      categories: ['Current'],
      labels: {
        style: {
          colors: 'var(--text-color)',
        },
      },
    },
    yaxis: {
      title: {
        text: 'L/min', // Assuming Flow Rate is in Liters per minute or other unit
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
      width: 2,
      colors: ['var(--text-color)'],
    },
    tooltip: {
      y: {
        formatter: val => `${val} L/min`, // Format the tooltip value
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
          <FaArrowDown style={{ marginRight: '8px', color: 'var(--text-color)' }} />
          Flow Rate - Current
        </h4>
      </div>
      <div className="chart-wrapper-c">
        {error ? (
          <div className="error-message">
            <h5>Sensor Error: Invalid or no data received for over 30 minutes.</h5>
          </div>
        ) : (
          <ReactApexChart options={options} series={[{ name: 'Flow Rate', data: series }]} type="bar" height={350} />
        )}
      </div>
    </div>
  );
};

export default FlowRateCurrent;
