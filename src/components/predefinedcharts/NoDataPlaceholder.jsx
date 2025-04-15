// src/components/PredefinedCharts/NoDataPlaceholder.jsx

import "./NoDataPlaceholder.scss";

const NoDataPlaceholder = () => {
  return (
    <div className="no-data-placeholder">
      <div className="skeleton-bar"></div>
      <div className="skeleton-line"></div>
      <div className="loader"></div>
      <p>Waiting for real-time sensor data...</p>
    </div>
  );
};

export default NoDataPlaceholder;
