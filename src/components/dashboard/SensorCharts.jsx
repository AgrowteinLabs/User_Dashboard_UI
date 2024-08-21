// src/components/dashboard/SensorChart.jsx

import React from 'react';
import PropTypes from 'prop-types';
import CurrentWaterLevelChart from './charts/CurrentWaterLevelChart';
import CurrentPhChart from './charts/CurrentPhChart';
import Last7DaysPhChart from './charts/Last7DaysPhChart';
import Last7DaysWaterLevelChart from './charts/Last7DaysWaterLevelChart';

const SensorChart = ({ title, type }) => {
  const renderChart = () => {
    switch (type) {
      case 'currentWaterLevel':
        return <CurrentWaterLevelChart />;
      case 'currentPh':
        return <CurrentPhChart />;
      case 'last7DaysPh':
        return <Last7DaysPhChart />;
      case 'last7DaysWaterLevel':
        return <Last7DaysWaterLevelChart />;
      default:
        return null;
    }
  };

  return (
    <div className="sensor-chart">
      <h3>{title}</h3>
      {renderChart()}
    </div>
  );
};

SensorChart.propTypes = {
  title: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
};

export default SensorChart;
