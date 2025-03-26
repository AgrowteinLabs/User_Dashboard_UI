export async function fetchSensorList(uid) {
  try {
    // Use the environment variable for the API URL
    const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/sensors/uid/${uid}`;

    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`Network response was not ok: ${response.status} - ${errorDetail}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sensor list:', error);
    throw error;
  }
}

    try {
      const url = `http://13.233.45.54:4500/api/v1/sensors/uid/${uid}`;
      const response = await fetch(url, { method: 'GET' });
  
      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`Network response was not ok: ${response.status} - ${errorDetail}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching sensor list:', error);
      throw error;
    }
  }
  