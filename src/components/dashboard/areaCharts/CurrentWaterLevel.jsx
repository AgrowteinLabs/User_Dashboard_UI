import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaWater } from "react-icons/fa";
import CircularProgress from '@mui/material/CircularProgress';
import { fetcheddata } from '../api/fetchdata';
import "./AreaCharts.scss";

const CurrentHumidity = () => {
  const [humidity, setHumidity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetcheddata();
        if (data && data.data) {
          setHumidity(data.data.Humidity); // Extract and set Humidity
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const series = humidity !== null ? [humidity] : [0]; // Default to 0 if humidity is null
  const options = {
    chart: {
      type: 'radialBar',
      height: 350,
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: '70%',
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            show: true,
            fontSize: '22px',
            fontWeight: 600,
            color: humidity !== null ? '#000' : '#FF0000', // Change color to red if humidity is null
            formatter: function (val) {
              return humidity !== null ? `${val}%` : 'Not available'; // Show "Not available" if humidity is null
            },
          },
        },
      },
    },
    fill: {
      colors: humidity !== null ? ['#00E396'] : ['#FF0000'], // Change color to red if humidity is null
    },
    stroke: {
      lineCap: 'round',
    },
    labels: ['Current Humidity'],
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title">
          <FaWater style={{ marginRight: "8px" }} />
          Current Humidity
        </h4>
      </div>
      <div className="chart-wrapper">
        {loading ? (
          <CircularProgress size="10rem" />
        ) : (
          <ReactApexChart options={options} series={series} type="radialBar" height={350} />
        )}
      </div>
    </div>
  );
};

export default CurrentHumidity;
