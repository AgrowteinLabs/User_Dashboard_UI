import PropTypes from "prop-types";
import noDataImage from "../../assets/images/Stress-pana.svg";
import "./NoDataPlaceholder.scss";

const NoDataPlaceholder = ({ lastUpdated, onShowHistory }) => {
  return (
    <div className="no-data-container">
      <img src={noDataImage} alt="No data" className="no-data-image" />
      <h2>No Real-Time Data Available</h2>
      {lastUpdated && (
        <p className="no-data-timestamp">
          Last data received at: <strong>{lastUpdated}</strong>
        </p>
      )}
      <p>Please ensure your device is connected and actively publishing.</p>
      {onShowHistory && (
        <button className="show-history-button" onClick={onShowHistory}>
          📈 View Historical Data
        </button>
      )}
    </div>
  );
};

NoDataPlaceholder.propTypes = {
  lastUpdated: PropTypes.string,
  onShowHistory: PropTypes.func,
};

export default NoDataPlaceholder;
