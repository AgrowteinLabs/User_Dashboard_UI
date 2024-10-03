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
    const response = await axios.post(`https://agrowtein-5u7w.onrender.com/api/v1/data/${uid}/date`, body, {
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
