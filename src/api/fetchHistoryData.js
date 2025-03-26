// apiUtils.js
import axios from 'axios';

/**
 * Fetch historical data for a product from the API
 * @param {string} productUid - The product UID
 * @param {string} endpoint - The specific data endpoint (e.g., 'Boiler_Temperature')
 * @param {string} startDate - The start date for the data range
 * @param {string} endDate - The end date for the data range
 * @returns {Promise} - Resolves with the filtered data
 */
export const fetchHistoryData = async (productUid, endpoint, startDate, endDate) => {
  try {
    if (!productUid) return [];

    const response = await axios.post(
      `http://13.233.45.54:4500/api/v1/data/${productUid}/date`,
      {
        startDate,
        endDate,
      }
    );

    if (response.data && response.data.length > 0) {
      const filteredData = filterByThirtyMinutes(response.data, endpoint);
      return filteredData;
    } else {
      console.error('No data available for the selected date range.');
      return [];
    }
  } catch (error) {
    console.error('Error fetching history data:', error);
    return [];
  }
};

/**
 * Filter data by 30 minutes intervals
 * @param {Array} data - The data to filter
 * @param {string} endpoint - The specific data point to filter (e.g., 'Boiler_Temperature')
 * @returns {Array} - The filtered data
 */
const filterByThirtyMinutes = (data, endpoint) => {
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
