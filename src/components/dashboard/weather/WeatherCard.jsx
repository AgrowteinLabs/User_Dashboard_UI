// import { useEffect, useState } from "react";
// import  fetchUser  from "../../../api/fetchuser";
// import { FaTemperatureHigh, FaWind, FaCompass, FaTint } from "react-icons/fa";
// import "./WeatherCard.scss";

// const WeatherCard = () => {
//     const [currentWeather, setCurrentWeather] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [userCity, setUserCity] = useState("Unknown Location");

//     useEffect(() => {
//         const controller = new AbortController();

//         const fetchUserAndWeather = async () => {
//             try {
//                 const userData = await fetchUser();
//                 if (userData.error) return;

//                 const city = userData?.address?.city || "Unknown Location";
//                 setUserCity(city);

//                 const geocodeResponse = await fetch(
//                     `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json`,
//                     { signal: controller.signal }
//                 );
//                 const geocodeData = await geocodeResponse.json();

//                 if (geocodeData.length > 0) {
//                     const { lat, lon } = geocodeData[0];

//                     const weatherResponse = await fetch(
//                         `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto&relative_humidity_2m=true`,
//                         { signal: controller.signal }
//                     );
//                     const weatherData = await weatherResponse.json();

//                     if (weatherData?.current_weather) {
//                         setCurrentWeather({
//                             temperature: weatherData.current_weather.temperature,
//                             windSpeed: weatherData.current_weather.windspeed,
//                             windDirection: weatherData.current_weather.winddirection,
//                             humidity: weatherData.current_weather.relative_humidity_2m ?? "N/A",
//                             weatherCode: weatherData.current_weather.weathercode,
//                         });
//                     }
//                 }
//             } catch (error) {
//                 if (error.name !== "AbortError") {
//                     console.error("Error fetching weather data:", error);
//                 }
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchUserAndWeather();

//         return () => controller.abort();
//     }, []);

//     // Function to map weather code to a description
//     const getWeatherDescription = (code) => {
//         const weatherConditions = {
//             0: "Clear Sky",
//             1: "Partly Cloudy",
//             2: "Cloudy",
//             3: "Overcast",
//             45: "Fog",
//             51: "Drizzle",
//             61: "Light Rain",
//             63: "Moderate Rain",
//             65: "Heavy Rain",
//             71: "Light Snow",
//             73: "Snow",
//             75: "Heavy Snow",
//             80: "Light Showers",
//             81: "Moderate Showers",
//             82: "Heavy Showers",
//         };
//         return weatherConditions[code] || "Unknown";
//     };

//     return (
//         <div className="weather-card">
//             <h2 className="weather-title">Current Weather in {userCity}</h2>
//             {loading ? (
//                 <div className="weather-loading"></div>
//             ) : (
//                 <div className="weather-details">
//                     {currentWeather && (
//                         <>
//                             <div className="weather-detail">
//                                 <FaTemperatureHigh className="icon temperature-icon" />
//                                 <div>
//                                     <p className="data-label">Temperature</p>
//                                     <p className="data-value">{currentWeather.temperature}°C</p>
//                                 </div>
//                             </div>
//                             <div className="weather-detail">
//                                 <FaWind className="icon wind-icon" />
//                                 <div>
//                                     <p className="data-label">Wind Speed</p>
//                                     <p className="data-value">{currentWeather.windSpeed} m/s</p>
//                                 </div>
//                             </div>
//                             <div className="weather-detail">
//                                 <FaCompass className="icon direction-icon" />
//                                 <div>
//                                     <p className="data-label">Wind Direction</p>
//                                     <p className="data-value">{currentWeather.windDirection}°</p>
//                                 </div>
//                             </div>
//                             <div className="weather-detail">
//                                 <FaTint className="icon humidity-icon" />
//                                 <div>
//                                     <p className="data-label">Humidity</p>
//                                     <p className="data-value">{currentWeather.humidity}%</p>
//                                 </div>
//                             </div>
//                             <div className="weather-detail">
//                                 <span className="icon weather-code-icon">🌤️</span>
//                                 <div>
//                                     <p className="data-label">Weather Condition</p>
//                                     <p className="data-value">{getWeatherDescription(currentWeather.weatherCode)}</p>
//                                 </div>
//                             </div>
//                         </>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default WeatherCard;
