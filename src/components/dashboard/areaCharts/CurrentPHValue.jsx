import React, { useEffect, useState, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaFlask } from "react-icons/fa";
import { fetcheddata } from '../../dashboard/api/fetchdata';
import { ProductContext } from '../../../context/ProductContext';
import "./AreaCharts.scss";

const CurrentPHValue = () => {
  const [currentPH, setCurrentPH] = useState(7); // Default pH value
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchPHData = async () => {
      if (!selectedProductUid) return;

      try {
        const data = await fetcheddata(selectedProductUid);
        if (data && data.data && data.data.pH !== undefined) {
          setCurrentPH(parseFloat(data.data.pH.toFixed(2))); // Format pH value to 2 decimal places
        } else {
          console.error("pH data not found in the API response");
        }
      } catch (error) {
        console.error("Error fetching pH data:", error);
      }
    };

    fetchPHData();

    // Optionally, refresh the data periodically
    const intervalId = setInterval(fetchPHData, 5000); // Refresh every 5 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [selectedProductUid]);

  const series = [currentPH];
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
          margin: 15,
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
            color: '#000',
            offsetY: 10,
            formatter: function (val) {
              return val ? val.toFixed(2) : "N/A"; // Format to 2 decimal places, or show "N/A"
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
        gradientToColors: ['#ABE5A1'],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: 'round',
    },
    labels: ['Current pH Value'],
    colors: ['#FEB019'],
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title">
          <FaFlask style={{ marginRight: "8px" }} />
          Current pH Value
        </h4>
      </div>
      <div className="chart-wrapper-center">
        <ReactApexChart options={options} series={series} type="radialBar" height={350} />
      </div>
    </div>
  );
};

export default CurrentPHValue;
