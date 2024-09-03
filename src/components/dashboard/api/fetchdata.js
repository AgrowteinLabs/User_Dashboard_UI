export async function fetcheddata(uid) {
    try {
      const url = `/api/v1/data/realtime/${uid}`;
      const response = await fetch(url);
  
      if (!response.ok) {
        const errorDetail = await response.text(); // Get the text of the error response
        throw new Error(`Network response was not ok: ${response.status} - ${errorDetail}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      return { error: error.message };
    }
  }
  