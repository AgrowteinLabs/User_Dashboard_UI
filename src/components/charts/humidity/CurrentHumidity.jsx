import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaTint } from "react-icons/fa";
import { fetcheddata } from '../../dashboard/api/fetchdata';
import { ProductContext } from '../../../context/ProductContext';
import '../AreaCharts.scss'

const CurrentHumidity = () => {
  const [series, setSeries] = useState([{ name: 'Humidity', data: [0] }]); // Initial humidity value
  const [error, setError] = useState(false); // Error state for stale data
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchHumidityData = async () => {
      if (!selectedProductUid) return;

      try {
        const data = await fetcheddata(selectedProductUid);
        console.log("Fetched Data Response:", JSON.stringify(data, null, 2)); // Log the complete response

        if (data && data.data && data.data.Humidity !== undefined && data.timestamp) {
          const serverTimestamp = new Date(data.timestamp).getTime(); // Convert server timestamp to milliseconds
          const currentTime = Date.now();

          // Check if the data is fresh (within the last 30 minutes)
          if (currentTime - serverTimestamp <= 30 * 60 * 1000) {
            const formattedHumidity = parseFloat(data.data.Humidity).toFixed(2); // Format to 2 decimal places
            setSeries([{ name: 'Humidity', data: [formattedHumidity] }]); // Update series with fresh data
            setError(false); // Clear error state
          } else {
            setError(true); // Mark data as stale
          }
        } else {
          console.error("Humidity data not found or invalid format in the API response");
          setError(true); // Handle missing or invalid data
        }
      } catch (error) {
        console.error("Error fetching humidity data:", error);
        setError(true); // Handle fetch errors
      }
    };

    // Fetch the humidity data initially
    fetchHumidityData();

    // Set up an interval to refresh the data periodically
    const intervalId = setInterval(fetchHumidityData, 1000); // Refresh every 1 second

    return () => clearInterval(intervalId); // Clean up the interval on component unmount
  }, [selectedProductUid]);

  const options = {
    chart: {
      type: 'bar',
      animations: {
        enabled: true,
        easing: 'bounce',
        speed: 1000,
      },
    },
    xaxis: {
      categories: ['Current'],
      labels: {
        style: {
          colors: 'var(--text-color)', // Use CSS variable for text color
        },
      },
    },
    yaxis: {
      title: {
        text: '%',
        style: {
          color: 'var(--text-color)', // Use CSS variable for text color
        },
      },
      labels: {
        style: {
          colors: 'var(--text-color)', // Use CSS variable for text color
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
      },
    },
    tooltip: {
      y: {
        formatter: val => `${val.toFixed(2)}%`, // Format tooltip values to 2 decimal places
      },
      style: {
        fontSize: '12px',
        fontFamily: undefined,
        colors: ['var(--text-color)'], // Tooltip text color for dark mode
      },
    },
    colors: ['var(--primary-color)'], // Use CSS variable for the bar color
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title" style={{ color: 'var(--text-color)' }}>
          <FaTint style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          Current Humidity
        </h4>
      </div>
      <div className="chart-wrapper-c">
        {error ? (
          <div className="error-message">
            <h5>Sensor Error: No data received for over 30 minutes.</h5>
          </div>
        ) : (
          <ReactApexChart options={options} series={series} type="bar" height={350} />
        )}
      </div>
    </div>
  );
};

export default CurrentHumidity;
