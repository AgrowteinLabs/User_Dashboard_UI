import axios from 'axios';

/**
 * Fetch historical data with interval grouping (default 30 mins)
 * @param {string} uid - Product UID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {number} intervalMinutes - Interval in minutes (default 30)
 * @returns {Promise<Array>} - Array of grouped data
 */
export const fetchHistoryData = async (uid, startDate, endDate, intervalMinutes = 30) => {
  try {
    if (!uid) return [];

    const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/data/${uid}/interval`;

    const response = await axios.get(url, {
      params: {
        startDate,
        endDate,
        interval: intervalMinutes,
      },
      withCredentials: true,
    });

    if (response.data && response.data.length > 0) {
      return response.data;
    } else {
      console.warn('No data found for the selected range.');
      return [];
    }
  } catch (error) {
    console.error('Error fetching interval data:', error);
    return [];
  }
};

/**
 * Fetches interval-sampled data for the given product UID.
 * @param {string} productUid - The product UID.
 * @param {string} startDate - Start date in YYYY-MM-DD format.
 * @param {string} endDate - End date in YYYY-MM-DD format.
 * @param {number} interval - Sampling interval in minutes.
 * @returns {Promise<Array>} - Array of interval-sampled data.
 */
export const fetchIntervalData = async (productUid, startDate, endDate, interval) => {
  try {
    const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/data/${productUid}/date-interval`;
    const params = new URLSearchParams({
      startDate,
      endDate,
      interval: interval.toString(),
    }).toString();

    const response = await axios.get(`${url}?${params}`, { withCredentials: true });

    if (response.data && response.data.length > 0) {
      return response.data;
    } else {
      console.warn("No interval data returned.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching interval data:", error);
    throw error;
  }
};
