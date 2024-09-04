export async function fetcheddata(uid) {
  try {
      const url = `https://agrowteinlabs.onrender.com/api/v1/data/realtime/${uid}`;
      
      const response = await fetch(url, {
          method: 'GET',
          credentials: 'include', // Ensures cookies are sent with the request
      });

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
