import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaTachometerAlt } from 'react-icons/fa';
import { fetcheddata } from '../../../api/fetchdata'; // Assuming the API function is correct
import { ProductContext } from '../../../context/ProductContext';
import '../AreaCharts.scss';

const CurrentPressure = () => {
  const [series, setSeries] = useState([0]); // Initial pressure value
  const [error, setError] = useState(false); // Error state for stale data
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchPressureData = async () => {
        if (!selectedProductUid) return;
      
        try {
          const data = await fetcheddata(selectedProductUid);
          // console.log("Fetched Pressure Data:", JSON.stringify(data, null, 2)); // Debugging
      
          if (data && data.data && data.data.Pressure !== undefined && data.timestamp) {
            const pressure = data.data.Pressure;
            const serverTimestamp = new Date(data.timestamp).getTime(); // Convert server timestamp to milliseconds
            const currentTime = Date.now();
      
            // Check if the pressure value is a valid number and non-negative
            if (isNaN(pressure) || pressure < 0) {
              setError(true); // Invalid data received (NaN or negative pressure), set error state
              return;
            }
      
            const formattedPressure = parseFloat(pressure).toFixed(2); // Format to 2 decimal places
      
            // Check if the data is fresh (within the last 30 minutes)
            if (currentTime - serverTimestamp <= 30 * 60 * 1000) {
              setSeries([formattedPressure]); // Update the series with fresh data
              setError(false); // Clear error state
            } else {
              setError(true); // Mark data as stale
            }
          } else {
            console.error("Pressure data not found or invalid format in the API response");
            setError(true); // Handle missing or invalid data
          }
        } catch (error) {
          console.error("Error fetching pressure data:", error);
          setError(true); // Handle fetch errors
        }
      };
      

    // Fetch the pressure data when the component mounts
    fetchPressureData();

    // Set up an interval to refresh the data periodically
    const intervalId = setInterval(fetchPressureData, 1000); // Refresh every 1 second

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
        text: 'hPa', // Pressure units (hectopascal)
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
        formatter: val => `${val} hPa`, // Display value with hPa unit
      },
      style: {
        fontSize: '12px',
        fontFamily: undefined,
        colors: ['var(--text-color)'], // Tooltip text color
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['var(--primary-color)'], // Color for data labels
        fontSize: '14px', // Font size for data labels
        fontWeight: 600,
      },
      formatter: (val) => `${val} hPa`, // Format data labels to display with units
      offsetY: -10, // Adjust label position (optional)
    },
  };
  

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title" style={{ color: 'var(--text-color)' }}>
          <FaTachometerAlt style={{ marginRight: '8px', color: 'var(--text-color)' }} />
          Current Pressure
        </h4>
      </div>
      <div className="chart-wrapper-c">
        {error ? (
          <div className="error-message">
            <h5>Sensor Error: Invalid data or no data received for over 30 minutes.</h5>
          </div>
        ) : (
          <ReactApexChart options={options} series={[{ name: 'Pressure', data: series }]} type="line" height={350} />
        )}
      </div>
    </div>
  );
};

export default CurrentPressure;
