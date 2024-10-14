import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaTint } from "react-icons/fa";
import { fetcheddata } from '../../dashboard/api/fetchdata';
import { ProductContext } from '../../../context/ProductContext';
import "./AreaCharts.scss";

const CurrentHumidity = () => {
  const [series, setSeries] = useState([{ name: 'Humidity', data: [0] }]);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchHumidityData = async () => {
      if (!selectedProductUid) return;

      try {
        const { data } = await fetcheddata(selectedProductUid);
        console.log(data); // Check the fetched data structure
        if (data && data.data && data.data.Humidity !== undefined) {
          setSeries([{ name: 'Humidity', data: [Number(data.data.Humidity)] }]);
        } else {
          console.error("Humidity data not found in the API response");
        }
      } catch (error) {
        console.error("Error fetching humidity data:", error);
      }
    };

    fetchHumidityData();
    const intervalId = setInterval(fetchHumidityData, 5000);

    return () => clearInterval(intervalId);
  }, [selectedProductUid]);

  const options = {
    chart: {
      type: 'bar',
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
          colors: 'var(--text-color)',
        }
      }
    },
    yaxis: {
      title: {
        text: '%',
        style: {
          color: 'var(--text-color)',
        },
      },
      labels: {
        style: {
          colors: 'var(--text-color)',
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
        colors: ['var(--text-color)'],
      },
    },
    colors: ['var(--primary-color)'],
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
