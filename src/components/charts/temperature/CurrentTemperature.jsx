import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaThermometerHalf } from "react-icons/fa";
import { fetcheddata } from '../../../api/fetchdata'; // Assuming the API function is correct
import { ProductContext } from '../../../context/ProductContext';
import '../AreaCharts.scss';

const CurrentTemperature = () => {
  const [series, setSeries] = useState([0]); // Initial temperature value for one sensor
  const [error, setError] = useState(false); // Error state for stale data
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchTemperatureData = async () => {
      if (!selectedProductUid) return;
    
      try {
        const data = await fetcheddata(selectedProductUid);
        console.log("Fetched Temperature Data:", JSON.stringify(data, null, 2)); // Debugging
    
        if (data && data.data) {
          const temperature = parseFloat(data.data.Temperature).toFixed(2); // Corrected the field to `data.data.Temperature`
          const serverTimestamp = new Date(data.timestamp).getTime(); // Convert server timestamp to milliseconds
          const currentTime = Date.now();
    
          // Check if the data is fresh (within the last 30 minutes)
          if (currentTime - serverTimestamp <= 30 * 60 * 1000) {
            setSeries([temperature]); // Update the series with the fresh data (for one sensor)
            setError(false); // Clear error state
          } else {
            setError(true); // Mark data as stale
          }
        } else {
          console.error("Temperature data not found or invalid format in the API response");
          setError(true); // Handle missing or invalid data
        }
      } catch (error) {
        console.error("Error fetching temperature data:", error);
        setError(true); // Handle fetch errors
      }
    };

    // Fetch the temperature data when the component mounts
    fetchTemperatureData();

    // Set up an interval to refresh the data every 10 seconds
    const intervalId = setInterval(fetchTemperatureData, 10000); // Refresh every 10 seconds

    return () => clearInterval(intervalId); // Clean up the interval on component unmount
  }, [selectedProductUid]);

  const options = {
    chart: {
      type: 'bar', // Bar chart for the current temperature
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
          ranges: [{ from: 0, to: 100, color: 'var(--primary-color)' }], // Customize color range if needed
        },
      },
    },
    xaxis: {
      categories: ['Sensor'], // Category for the temperature sensor
      labels: {
        style: {
          colors: 'var(--text-color)',
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
      width: 2,
      colors: ['var(--text-color)'],
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
          <FaThermometerHalf style={{ marginRight: '8px', color: 'var(--text-color)' }} />
          Temperature - Current
        </h4>
      </div>
      <div className="chart-wrapper-c">
        {error ? (
          <div className="error-message">
            <h5>Sensor Error: No data received for over 30 minutes.</h5>
          </div>
        ) : (
          <ReactApexChart options={options} series={[{ name: 'Temperature', data: series }]} type="bar" height={350} />
        )}
      </div>
    </div>
  );
};

export default CurrentTemperature;
