import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaLeaf } from "react-icons/fa";
import { fetcheddata } from '../../dashboard/api/fetchdata'; // Assuming you're using the same API to fetch CO2 data
import { ProductContext } from '../../../context/ProductContext';

const CurrentCO2Level = () => {
  const [series, setSeries] = useState([0]); // Initial CO2 level
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchCO2Data = async () => {
      if (!selectedProductUid) return;

      try {
        const data = await fetcheddata(selectedProductUid);
        if (data && data.data && data.data.CO2Level !== undefined) {
          setSeries([data.data.CO2Level]); // Update the series with CO2 level
        } else {
          console.error("CO2 level data not found in the API response");
        }
      } catch (error) {
        console.error("Error fetching CO2 data:", error);
      }
    };

    // Fetch the CO2 data once when the component mounts
    fetchCO2Data();

    // Optionally, set up an interval to refresh the data every 1 second
    const intervalId = setInterval(fetchCO2Data, 1000);

    return () => clearInterval(intervalId); // Clean up the interval on component unmount
  }, [selectedProductUid]);

  const options = {
    chart: {
      type: 'radialBar',
      animations: {
        enabled: true,
        easing: 'easeout',
        speed: 800,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 15,
          size: '70%',
        },
        dataLabels: {
          value: {
            fontSize: '36px',
            formatter: val => `${val} ppm`,
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
        gradientToColors: ['#A0C334'],
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: 'round',
    },
    labels: ['Current CO2 Level'],
    colors: ['#FEB019'],
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title">
          <FaLeaf style={{ marginRight: "8px" }} />
          Current CO2 Level
        </h4>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="radialBar" height={350} />
      </div>
    </div>
  );
};

export default CurrentCO2Level;
