// Set controls data
export async function setControls(uid, controlData) {
    try {
      const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/controls/${uid}`;
  
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(controlData), // Sending controlData as the request body
      });
  
      if (!response.ok) {
        const errorDetails = await response.text();
        if (response.status === 404) {
          throw new Error(`404 Not Found: ${errorDetails}`);
        } else {
          throw new Error(`Error: ${response.status}, ${errorDetails}`);
        }
      }
  
      const data = await response.json();
      // console.log("API Raw Response:", JSON.stringify(data, null, 2)); // Log raw API response
      return data; // Return raw response
    } catch (error) {
      console.error('Error setting controls:', error);
      if (error.message.includes('404')) {
        return { error: 404 }; // Return 404
      }
      return { error: 'Failed to set controls' };
    }
  }
  