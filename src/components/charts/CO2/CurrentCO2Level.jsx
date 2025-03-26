import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaLeaf } from "react-icons/fa";
import { fetcheddata } from '../../../api/fetchdata';
import { ProductContext } from '../../../context/ProductContext';
import '../AreaCharts.scss'

const CurrentCO2Level = () => {
  const [series, setSeries] = useState([0]); // Initial CO2 level
  const [error, setError] = useState(false); // Error state to show the message
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchCO2Data = async () => {
      if (!selectedProductUid) return;

      try {
        const data = await fetcheddata(selectedProductUid);
        console.log("Fetched CO2 Data:", JSON.stringify(data, null, 2)); // Debugging

        if (data && data.data && data.timestamp) {
          const serverTimestamp = new Date(data.timestamp).getTime(); // Convert server timestamp to milliseconds
          const currentTime = Date.now();

          // Check if the data is fresh (within the last 30 minutes)
          if (currentTime - serverTimestamp <= 30 * 60 * 1000) {
            const formattedCO2 = parseFloat(data.data.Co2).toFixed(2); // Format to 2 decimals
            setSeries([formattedCO2]); // Update series with fresh data
            setError(false); // Clear any error state
          } else {
            setError(true); // Mark as stale data
          }
        } else {
          console.error("Invalid data format or missing timestamp");
          setError(true);
        }
      } catch (error) {
        console.error("Error fetching CO2 data:", error);
        setError(true); // Handle fetch errors
      }
    };

    // Fetch the CO2 data initially
    fetchCO2Data();

    // Set up an interval to fetch the data periodically
    const intervalId = setInterval(fetchCO2Data, 1000);

    return () => clearInterval(intervalId); // Clean up the interval on component unmount
  }, [selectedProductUid]);

  const options = {
    chart: {
      type: 'radialBar',
      animations: {
        enabled: true,
        easing: 'easeout',
        speed: 400,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 25,
          size: '80%',
        },
        dataLabels: {
          value: {
            fontSize: '36px',
            formatter: val => `${val} ppm`, // Format value with unit
            offsetY: 110, // Position at the bottom
          },
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['#008000'],
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: 'round',
    },
    labels: ['Current CO2 Level'],
    colors: ['#03856d'],
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title">
          <FaLeaf style={{ marginRight: "8px" }} />
          Current CO2 Level
        </h4>
      </div>
      <div className="chart-wrapper-c">
        {error ? (
          <div className="error-message">
            <h5>Sensor Error: No data received for over 30 minutes.</h5>
          </div>
        ) : (
          <ReactApexChart options={options} series={series} type="radialBar" height={350} />
        )}
      </div>
    </div>
  );
};

export default CurrentCO2Level;
