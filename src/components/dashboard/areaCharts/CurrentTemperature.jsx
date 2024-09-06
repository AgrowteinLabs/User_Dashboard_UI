import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaThermometerHalf } from "react-icons/fa";
import { fetcheddata } from '../../dashboard/api/fetchdata';
import { ProductContext } from '../../../context/ProductContext';
import "./AreaCharts.scss";

const CurrentTemperature = () => {
  const [currentTemperature, setCurrentTemperature] = useState(null); // Default temperature
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchTemperatureData = async () => {
      if (!selectedProductUid) return;

      try {
        const data = await fetcheddata(selectedProductUid);

        // Correctly access the temperature data based on the API response structure
        if (data && data.data && data.data.Temperature !== undefined) {
          setCurrentTemperature(parseFloat(data.data.Temperature.toFixed(2))); // Format temperature to 2 decimal places
        } else {
          console.error("Temperature data not found in the API response");
          setCurrentTemperature(null); // Set to null if temperature data not found
        }
      } catch (error) {
        console.error("Error fetching temperature data:", error);
        setCurrentTemperature(null); // Set to null in case of error
      }
    };

    fetchTemperatureData();

    // Refresh the data every 5 seconds
    const intervalId = setInterval(fetchTemperatureData, 5000);

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [selectedProductUid]);

  const series = [{ name: 'Temperature', data: [currentTemperature || 0] }];
  
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
      categories: ['Current'],
      labels: {
        style: {
          colors: 'var(--text-color)', // Use CSS variable for text color
        }
      }
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
        }
      }
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
        formatter: val => `${val}°C`,
      },
      style: {
        fontSize: '12px',
        colors: ['var(--text-color)'], // Tooltip text color for dark mode
      },
    },
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title" style={{ color: 'var(--text-color)' }}>
          <FaThermometerHalf style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          Current Temperature
        </h4>
      </div>

      {currentTemperature !== null ? (
        <div className="chart-wrapper">
          <ReactApexChart options={options} series={series} type="line" height={350} />
        </div>
      ) : (
        <div className="sensor-error" style={{ color: 'red', fontWeight: 'bold', textAlign: 'center', height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          Sensor Error
        </div>
      )}
    </div>
  );
};

export default CurrentTemperature;
