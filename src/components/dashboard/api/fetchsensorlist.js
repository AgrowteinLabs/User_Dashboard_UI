export async function fetchSensorList(uid) {
    try {
        const url = `https://agrowteinlabs.onrender.com/api/v1/sensors/uid/${uid}`;
        
        const response = await fetch(url, {
            method: 'GET',
        });
    
        if (!response.ok) {
            const errorDetail = await response.text(); // Get the text of the error response
            throw new Error(`Network response was not ok: ${response.status} - ${errorDetail}`);
        }
    
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching sensor list:', error);
        // Consider rethrowing the error or returning a specific error format if needed
        throw error; 
    }
}
