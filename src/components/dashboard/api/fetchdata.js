export async function fetcheddata(uid) {
  try {
    const url = `https://agrowtein-5u7w.onrender.com/api/v1/data/realtime/${uid}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('404'); // Handle 404
      } else {
        throw new Error(`Error: ${response.status}`); // Handle other errors
      }
    }

    const data = await response.json();
    console.log("API Raw Response:", JSON.stringify(data, null, 2)); // Log raw API response
    return data; // Return raw response
  } catch (error) {
    console.error('Error fetching data:', error);
    if (error.message === '404') {
      return { error: 404 }; // Return 404
    }
    return { error: 'Failed to fetch data' };
  }
} 
