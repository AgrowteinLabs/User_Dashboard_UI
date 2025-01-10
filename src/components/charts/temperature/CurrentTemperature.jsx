import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaThermometerHalf } from "react-icons/fa";
import { fetcheddata } from '../../../api/fetchdata'; // Assuming the API function is correct
import { ProductContext } from '../../../context/ProductContext';
import '../AreaCharts.scss'

const CurrentTemperature = () => {
  const [series, setSeries] = useState([0]); // Initial temperature value
  const [error, setError] = useState(false); // Error state for stale data
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchTemperatureData = async () => {
      if (!selectedProductUid) return;
    
      try {
        const data = await fetcheddata(selectedProductUid);
        console.log("Fetched Temperature Data:", JSON.stringify(data, null, 2)); // Debugging
    
        if (data && data.data) {
          const temperature1 = parseFloat(data.data.Temperature_Sensor_1).toFixed(2); // Get the first temperature sensor
          const temperature2 = parseFloat(data.data.Temperature_Sensor_2).toFixed(2); // Get the second temperature sensor
          const serverTimestamp = new Date(data.timestamp).getTime(); // Convert server timestamp to milliseconds
          const currentTime = Date.now();
    
          // Check if the data is fresh (within the last 30 minutes)
          if (currentTime - serverTimestamp <= 30 * 60 * 1000) {
            setSeries([temperature1, temperature2]); // Update the series with fresh data
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

    // Set up an interval to refresh the data periodically
    const intervalId = setInterval(fetchTemperatureData, 1000); // Refresh every 1 second

    return () => clearInterval(intervalId); // Clean up the interval on component unmount
  }, [selectedProductUid]);

  const options = {
    chart: {
      type: 'line',
      animations: {
        enabled: true,
        easing: 'easeout',
        speed: 800,
      },
    },
    xaxis: {
      categories: ['Current'], // Category for the x-axis
      labels: {
        style: {
          colors: 'var(--text-color)', // Use CSS variable for text color
        },
      },
    },
    yaxis: {
      title: {
        text: '°C',
        style: {
          color: 'var(--text-color)', // Use CSS variable for axis title color
        },
      },
      labels: {
        style: {
          colors: 'var(--text-color)', // Use CSS variable for text color
        },
      },
    },
    stroke: {
      width: 8,
      curve: 'smooth',
      colors: ['var(--primary-color)'], // Use CSS variable for stroke color
    },
    markers: {
      size: 8,
      colors: ['var(--primary-color)'], // Marker color
      strokeColors: 'var(--background-color)', // Adjust for light or dark background
      strokeWidth: 2,
    },
    tooltip: {
      y: {
        formatter: val => `${val}°C`, // Display value with °C unit
      },
      style: {
        fontSize: '12px',
        fontFamily: undefined,
        colors: ['var(--text-color)'], // Tooltip text color
      },
    },
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title" style={{ color: 'var(--text-color)' }}>
          <FaThermometerHalf style={{ marginRight: '8px', color: 'var(--text-color)' }} />
          Current Temperature
        </h4>
      </div>
      <div className="chart-wrapper-c">
        {error ? (
          <div className="error-message">
            <h5>Sensor Error: No data received for over 30 minutes.</h5>
          </div>
        ) : (
          <ReactApexChart options={options} series={[{ name: 'Temperature', data: series }]} type="line" height={350} />
        )}
      </div>
    </div>
  );
};

export default CurrentTemperature;
