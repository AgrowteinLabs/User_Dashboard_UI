export async function fetcheddata(uid) {
  try {
    const url = `https://agrowtein-5u7w.onrender.com/api/v1/data/realtime/${uid}`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Ensures cookies are sent with the request
    });

    // If response is not ok, handle the error based on status code
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('404'); // Throw a 404 error
      } else {
        throw new Error(`Error: ${response.status}`); // Other errors
      }
    }

    const data = await response.json();
    return { data }; // Return the data inside an object
  } catch (error) {
    // Log the error and return the error code or message
    // console.error('Error fetching data:', error);

    if (error.message === '404') {
      return { error: 404 }; // Return an error object with 404 code
    }
    
    return { error: 'Failed to fetch data' }; // Return a generic error object for other errors
  }
}
