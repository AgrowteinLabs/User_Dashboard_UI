export default async function findTempAndHumidity() {
    try {
        const API_URL = "/api/v1/mockdata";
        
        const response = await fetch(API_URL);
        const data = await response.json();

        // Assuming data is an array of objects
        const temperatures = data.map(item => item.temperature);
        const humidityLevels = data.map(item => item.humidity);

        // Get the last value of each array
        const last = temperatures.length - 1;
        const lastTemperature = temperatures[last];
        const lastHumidityLevel = humidityLevels[humidityLevels.length - 1];

        return { lastHumidityLevel, lastTemperature };

    } catch (error) {
        console.error('Error fetching data:', error);
    }
};
