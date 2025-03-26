import React, { useEffect, useState, useContext } from "react";
import ReactApexChart from "react-apexcharts";
import { FaFlask } from "react-icons/fa";
import axios from "axios";
import { ProductContext } from "../../../context/ProductContext";
import "../AreaCharts.scss";

const PHValueHistory = () => {
  const [series, setSeries] = useState([{ name: "pH Value", data: [] }]);
  const [categories, setCategories] = useState([]);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchPHHistory = async () => {
      if (!selectedProductUid) return;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/data/${selectedProductUid}/date`,
          {
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
            endDate: new Date().toISOString(), // Current date
          }
        );

        if (response.data && response.data.length > 0) {
          const filteredData = filterByThirtyMinutes(response.data);
          const phValues = filteredData.map((entry) =>
            parseFloat(entry.data.pH).toFixed(2) // Format pH value to 2 decimal points
          );
          const timestamps = filteredData.map((entry) =>
            new Date(entry.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          );

          setSeries([{ name: "pH Value", data: phValues }]);
          setCategories(timestamps);
        } else {
          console.error("No pH data available for the selected date range.");
        }
      } catch (error) {
        console.error("Error fetching pH value history:", error);
      }
    };

    fetchPHHistory();
  }, [selectedProductUid]);

  const filterByThirtyMinutes = (data) => {
    const result = [];
    let lastTimestamp = null;

    data.forEach((entry) => {
      const entryTime = new Date(entry.timestamp);
      if (!lastTimestamp || entryTime - lastTimestamp >= 30 * 60 * 1000) {
        result.push(entry);
        lastTimestamp = entryTime;
      }
    });

    return result;
  };

  const options = {
    chart: {
      type: "line", // Line chart for pH value history
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: "var(--text-color)", // Use CSS variable for text color
        },
      },
      tickAmount: "dataPoints",
      title: {
        text: "Time (Last 24 Hours)",
        style: {
          color: "var(--text-color)",
        },
      },
    },
    yaxis: {
      title: {
        text: "pH Value",
        style: {
          color: "var(--text-color)", // Axis title color
        },
      },
      labels: {
        style: {
          colors: "var(--text-color)", // Label color
        },
      },
    },
    stroke: {
      curve: "smooth", // Smooth line curve
      width: 3,
      colors: ["#03856d"], // Line color for pH values
    },
    fill: {
      type: "gradient", // Gradient fill for the line chart
      gradient: {
        shade: "light", // Light gradient shade
        type: "horizontal", // Horizontal gradient
        shadeIntensity: 0.5,
        gradientToColors: ["#81c784"], // Color at the end of the gradient
        opacityFrom: 0.5, // Initial opacity
        opacityTo: 0, // Final opacity
        stops: [0, 100], // Gradient stops
      },
    },
    markers: {
      size: 5,
      colors: ["#FFA41B"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 8,
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `${val.toFixed(2)}`, // Show pH value with 2 decimal points
      },
      style: {
        fontSize: "12px",
        colors: ["var(--text-color)"], // Tooltip text color for dark mode
      },
    },
  };

  return (
    <div className="bar-chart">
      <div className="bar-chart-info">
        <h5 className="bar-chart-title" style={{ color: "var(--text-color)" }}>
          <FaFlask
            style={{ marginRight: "8px", color: "var(--text-color)" }}
          />
          pH Value History (Last 24 Hours)
        </h5>
      </div>
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="line" height={350} />
      </div>
    </div>
  );
};

export default PHValueHistory;
