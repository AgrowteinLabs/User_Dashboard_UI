import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaTint } from "react-icons/fa";
import CircularProgress from '@mui/material/CircularProgress';
import "./AreaCharts.scss";
import fetchDataForDateRange from '../api/fetch7day'; 

const HumidityLast7Days = () => {
  const [humidityData, setHumidityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHumidityData = async () => {
      try {
        const response = await fetchDataForDateRange();
        const humidityValues = response.map(item => item.humidity); // Assuming the response contains a 'humidity' field
        setHumidityData(humidityValues);
      } catch (error) {
        console.error("Error fetching humidity data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHumidityData();
  }, []);

  const series = [{
    name: 'Humidity',
    data: humidityData
  }];

  const options = {
    chart: {
      type: 'area',
      height: 350,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
      zoom: {
        enabled: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
    },
    xaxis: {
      type: 'numeric',
      labels: {
        show: true,
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 100]
      }
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + '%';
        }
      }
    },
    colors: ['#00E396'],
  };

  return (
    <div className="bar-chart">
      <div className="bar-chart-info">
        <h5 className="bar-chart-title">
          <FaTint style={{ marginRight: "8px" }} />
          Humidity Data
        </h5>
      </div>
      <div className="chart-wrapper">
        {loading ? (
          <CircularProgress />
        ) : (
          <ReactApexChart options={options} series={series} type="area" height={350} />
        )}
      </div>
    </div>
  );
};

export default HumidityLast7Days;
