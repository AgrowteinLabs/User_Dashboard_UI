import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaWater } from "react-icons/fa";
import Modal from 'react-modal';
import "../AreaCharts.scss";
import findTempAndHumidity from '../../dashboard/api/fetchpdata';
import { CircularProgress } from '@mui/material';

Modal.setAppElement('#root'); // This is to avoid accessibility issues

const CurrentWaterLevel = () => {
  const [lastHumidityLevel, setLastHumidityLevel] = useState(null);
  const [lastTemperature, setLastTemperature] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { lastHumidityLevel, lastTemperature } = await findTempAndHumidity();
      setLastHumidityLevel(lastHumidityLevel);
      setLastTemperature(lastTemperature);
    };

    fetchData();
  }, []);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [newWaterLevel, setNewWaterLevel] = useState(lastHumidityLevel);

  const series = lastHumidityLevel !== null ? [lastHumidityLevel] : [];
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
    labels: ['Current Water Level'],
  };

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleWaterLevelChange = (e) => {
    setNewWaterLevel(e.target.value);
  };

  const saveWaterLevel = () => {
    // In this case, we do nothing with the newWaterLevel since it's for another purpose
    closeModal();
  };

  return (
    <div className="progress-bar">
      <div className="progress-bar-info">
        <h4 className="progress-bar-title" style={{ color: 'var(--text-color)' }}>
          <FaWater style={{ marginRight: "8px", color: 'var(--text-color)' }} />
          Current Water Level
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
          Adjust Water Level
        </button>
      </div>
      <div className="chart-wrapper">
        {lastHumidityLevel === null ? (
          <CircularProgress />
        ) : (
          <ReactApexChart options={options} series={series} type="radialBar" height={350} />
        )}
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Adjust Water Level"
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
        <h2>Adjust Water Level</h2>
        <input
          type="range"
          min="0"
          max="100"
          value={newWaterLevel}
          onChange={handleWaterLevelChange}
          style={{ width: '100%' }}
        />
        <p>{newWaterLevel}%</p>
        <button
          onClick={saveWaterLevel}
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

export default CurrentWaterLevel;
