import axios from 'axios';

async function fetchLast7DaysData(uid = 'avi001') {
  const endDate = new Date(); // Current date
  const startDate = new Date(); 
  startDate.setDate(endDate.getDate() - 7); // Set start date to 7 days ago

  const body = {
    startDate: startDate.toISOString(), // Format the start date as ISO string
    endDate: endDate.toISOString(), // Format the end date as ISO string
  };

  try {
    // Use the environment variable for the API URL
    const apiUrl = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/data/${uid}/date`;

    const response = await axios.post(apiUrl, body, {
      headers: {
        'Content-Type': 'application/json',
        // Add authorization token here if needed
      },
    });
    console.log('Data received for last 7 days:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching last 7 days data:', error);
    throw error;
  }
}

export default fetchLast7DaysData;
