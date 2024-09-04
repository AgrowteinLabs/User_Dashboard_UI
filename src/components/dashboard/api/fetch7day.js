import axios from 'axios';

async function fetchDataForDateRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 1);

  const body = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };

  try {
    const response = await axios.post('https://agrowteinlabs.onrender.com/api/v1/data/avi001/date', body);
    console.log('Data received:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

export default fetchDataForDateRange;
