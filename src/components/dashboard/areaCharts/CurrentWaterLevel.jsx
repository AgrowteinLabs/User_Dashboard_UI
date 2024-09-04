import React, { useState, useEffect, useContext } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaWater } from "react-icons/fa";
import Modal from 'react-modal';
import CircularProgress from '@mui/material/CircularProgress';
import "./AreaCharts.scss";
import { fetcheddata } from '../../dashboard/api/fetchdata';
import { ProductContext } from '../../../context/ProductContext';

Modal.setAppElement('#root'); // This is to avoid accessibility issues

const CurrentHumidity = () => {
  const [humidity, setHumidity] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    let isActive = true; // Flag to manage async operation

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetcheddata(selectedProductUid);
        const humidityValue = data?.data?.Humidity;

        if (isActive) {
          setLoading(false);
          if (humidityValue !== undefined && humidityValue !== null) {
            setHumidity(parseFloat(humidityValue.toFixed(2))); // Set humidity with two decimal places
          } else {
            setHumidity(null); // Invalid or null value
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isActive) {
          setLoading(false);
          setHumidity(null); // Set to null explicitly in case of error
        }
      }
    };

    // Set up interval to fetch data every second
    const intervalId = setInterval(fetchData, 3000);

    // Clean up the interval on unmount or if `selectedProductUid` changes
    return () => {
      isActive = false; // Cancel the subscription
      clearInterval(intervalId);
    };
  }, [selectedProductUid]);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [newHumidity, setNewHumidity] = useState(humidity);

  const series = humidity !== null ? [humidity] : [];
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
            color: 'var(--text-color)', // Use CSS variable for text color
            formatter: function (val) {
              return val + '%';
            },
          },
        },
      },
    },
    fill: {
      colors: ['var(--primary-color)'], // Use CSS variable for fill color
    },
    stroke: {
      lineCap: 'round',
    },
    labels: ['Current Humidity'],
  };

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleHumidityChange = (e) => {
    setNewHumidity(e.target.value);
  };

  const saveHumidity = () => {
    closeModal();
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title" style={{ color: 'var(--text-color)' }}>
          <FaWater style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          Current Humidity
        </h4>
        <button
          onClick={openModal}
          style={{
            marginLeft: '15px',
            padding: '5px 10px',
            cursor: 'pointer',
            backgroundColor: '#03856d',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Adjust Humidity
        </button>
      </div>
      <div className="chart-wrapper">
        {loading ? (
          <CircularProgress />
        ) : humidity === null ? (
          <div style={{ color: 'red', fontSize: '18px', textAlign: 'center' }}>
            Sensor Error
          </div>
        ) : (
          <ReactApexChart options={options} series={series} type="radialBar" height={350} />
        )}
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Adjust Humidity"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--background-color)',
            color: 'var(--text-color)',
          },
        }}
      >
        <h2>Adjust Humidity</h2>
        <input
          type="range"
          min="0"
          max="100"
          value={newHumidity}
          onChange={handleHumidityChange}
          style={{ width: '100%' }}
        />
        <p>{newHumidity}%</p>
        <button
          onClick={saveHumidity}
          style={{
            padding: '5px 10px',
            cursor: 'pointer',
            backgroundColor: '#03856d',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Save
        </button>
        <button
          onClick={closeModal}
          style={{
            padding: '5px 10px',
            cursor: 'pointer',
            marginLeft: '10px',
            backgroundColor: '#03856d',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Cancel
        </button>
      </Modal>
    </div>
  );
};

export default CurrentHumidity;
