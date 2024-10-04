import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaThermometerHalf } from "react-icons/fa";
import { fetcheddata } from '../../dashboard/api/fetchdata';
import { ProductContext } from '../../../context/ProductContext';
import "./AreaCharts.scss"; // Ensure this matches the path for your SCSS file

const CurrentCO2Level = () => {
  const [co2Level, setCO2Level] = useState(0); // Default CO2 level
  const { selectedProductUid } = useContext(ProductContext);
  const maxCO2Level = 50000; // Set the thermometer max level

  useEffect(() => {
    const fetchCO2Data = async () => {
      if (!selectedProductUid) return;

      try {
        const { data } = await fetcheddata(selectedProductUid);
        console.log(data); // Check the fetched data structure
        if (data && data.data && data.data.Co2 !== undefined) {
          setCO2Level(Number(data.data.Co2)); // Access nested data
        } else {
          console.error("CO2 data not found in the API response");
        }
      } catch (error) {
        console.error("Error fetching CO2 data:", error);
      }
    };

    fetchCO2Data();
    const intervalId = setInterval(fetchCO2Data, 5000);

    return () => clearInterval(intervalId);
  }, [selectedProductUid]);

  const series = [{
    name: "CO2 Level",
    data: [co2Level]
  }];

  const options = {
    chart: {
      type: 'bar',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '30%',
        borderRadius: 10,
        dataLabels: {
          position: 'center', // Position data labels at the top of the bar
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: val => `${val} ppm`,
      offsetY: -10,
      style: {
        fontSize: '12px',
        colors: ['#fff'],
      },
    },
    yaxis: {
      max: maxCO2Level, // Set maximum value to 4000 ppm for the thermometer scale
      labels: {
        style: {
          colors: 'var(--text-color)',
        }
      },
      title: {
        text: 'ppm',
        style: {
          color: 'var(--text-color)',
        },
      },
    },
    xaxis: {
      categories: ['CO2'],
      labels: {
        show: false, // Hide x-axis label as it's not needed for a thermometer chart
      },
    },
    colors: ['#03856d'], // Color to represent the thermometer filling
    fill: {
      colors: ['#03856d'],
      type: 'solid'
    },
    tooltip: {
      y: {
        formatter: val => `${val} ppm`,
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
          <FaThermometerHalf style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          Current CO2 Level
        </h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="bar" height={350} />
      </div>
    </div>
  );
};

export default CurrentCO2Level;
