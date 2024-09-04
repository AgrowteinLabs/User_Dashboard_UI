import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaTint } from "react-icons/fa";
import { fetcheddata } from '../../dashboard/api/fetchdata';
import { ProductContext } from '../../../context/ProductContext';

const CurrentHumidity = () => {
  const [series, setSeries] = useState([{ name: 'Humidity', data: [0] }]);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchHumidityData = async () => {
      if (!selectedProductUid) return;

      try {
        const data = await fetcheddata(selectedProductUid);
        if (data && data.data && data.data.Humidity !== undefined) {
          setSeries([{ name: 'Humidity', data: [data.data.Humidity] }]);
        } else {
          console.error("Humidity data not found in the API response");
        }
      } catch (error) {
        console.error("Error fetching humidity data:", error);
      }
    };

    // Fetch the humidity data once when the component mounts
    fetchHumidityData();

    // Optionally, you can set up an interval to refresh the data periodically
    const intervalId = setInterval(fetchHumidityData, 1000); // Refresh every 1 seconds

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
        }
      }
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
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
      },
    },
    tooltip: {
      y: {
        formatter: val => `${val}%`,
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
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="bar" height={350} />
      </div>
    </div>
  );
};

export default CurrentHumidity;
