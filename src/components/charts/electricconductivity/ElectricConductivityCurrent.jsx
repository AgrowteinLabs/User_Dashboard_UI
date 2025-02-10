import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaBolt } from "react-icons/fa";  // Use an icon suitable for Electric Conductivity
import { fetcheddata } from '../../dashboard/api/fetchdata'; 
import { ProductContext } from '../../../context/ProductContext';
import '../AreaCharts.scss';

const ElectricConductivityCurrent = () => {
  const [series, setSeries] = useState([0]); 
  const [error, setError] = useState(false);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchConductivityData = async () => {
      if (!selectedProductUid) return;
    
      try {
        const data = await fetcheddata(selectedProductUid);

        if (data && data.data) {
          const electricConductivity = data.data.Electric_Conductivity;
          const serverTimestamp = new Date(data.timestamp).getTime(); 
          const currentTime = Date.now();
    
          // Check if the data is a valid decimal value
          if (isNaN(electricConductivity) || !/^\d+(\.\d+)?$/.test(electricConductivity)) {
            setError(true); // Invalid data received, set error state
            return;
          }

          const formattedConductivity = parseFloat(electricConductivity).toFixed(2);

          // Check if the data is fresh (within 30 minutes)
          if (currentTime - serverTimestamp <= 30 * 60 * 1000) {
            setSeries([formattedConductivity]);
            setError(false);
          } else {
            setError(true);
          }
        }
      } catch (error) {
        setError(true); // Error fetching data
      }
    };

    fetchConductivityData();
    const intervalId = setInterval(fetchConductivityData, 1000); 
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
        borderRadius: 5,
        horizontal: false,
        columnWidth: '30%',
        colors: {
          backgroundBarOpacity: 1,
          backgroundBarRadius: 5,
          ranges: [{ from: 0, to: 100, color: 'var(--primary-color)' }],
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
        text: 'µS/cm',  // Typical unit for Electric Conductivity (microsiemens per centimeter)
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
        formatter: val => `${val} µS/cm`, // Format tooltip with the correct unit
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
          <FaBolt style={{ marginRight: '8px', color: 'var(--text-color)' }} />
          Electric Conductivity - Current
        </h4>
      </div>
      <div className="chart-wrapper-c">
        {error ? (
          <div className="error-message">
            <h5>Sensor Error: Invalid or no data received for over 30 minutes.</h5>
          </div>
        ) : (
          <ReactApexChart options={options} series={[{ name: 'Electric Conductivity', data: series }]} type="bar" height={350} />
        )}
      </div>
    </div>
  );
};

export default ElectricConductivityCurrent;
