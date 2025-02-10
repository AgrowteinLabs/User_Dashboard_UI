import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaFlask } from "react-icons/fa";
import { fetcheddata } from '../../dashboard/api/fetchdata'; // Assuming you're using the same API to fetch pH data
import { ProductContext } from '../../../context/ProductContext';

const CurrentPHValue = () => {
  const [series, setSeries] = useState([0]); // Initial pH value
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchPHData = async () => {
      if (!selectedProductUid) return;

      try {
        const data = await fetcheddata(selectedProductUid);
        if (data && data.data && data.data.pH !== undefined) {
          // Set pH value with two decimal places
          setSeries([parseFloat(data.data.pH).toFixed(2)]); // Update the series with the pH value
        } else {
          console.error("pH value data not found in the API response");
        }
      } catch (error) {
        console.error("Error fetching pH data:", error);
      }
    };

    // Fetch the pH data once when the component mounts
    fetchPHData();

    // Optionally, set up an interval to refresh the data periodically
    const intervalId = setInterval(fetchPHData, 1000); // Refresh every 1 second

    return () => clearInterval(intervalId); // Clean up the interval on component unmount
  }, [selectedProductUid]);

  const options = {
    chart: {
      type: 'radialBar',
      height: 350,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: {
          margin: 20,
          size: '70%',
          background: 'transparent',
        },
        dataLabels: {
          showOn: 'always',
          name: {
            show: false,
          },
          value: {
            show: true,
            fontSize: '36px',
            fontWeight: 'bold',
            color: 'var(--text-color)', // Use CSS variable for text color
            offsetY: 10,
            formatter: function (val) {
              return val;
            },
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
        gradientToColors: ['var(--gradient-color)'], // Gradient end color
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50],
      },
    },
    stroke: {
      lineCap: 'round',
    },
    labels: ['Current pH Value'],
    colors: ['var(--primary-color)'], // Use CSS variable for radial bar color
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title" style={{ color: 'var(--text-color)' }}>
          <FaFlask style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          pH Value - Current
        </h4>
      </div>
      <div className="chart-wrapper-center">
        <ReactApexChart options={options} series={series} type="radialBar" height={350} />
      </div>
    </div>
  );
};

export default CurrentPHValue;
