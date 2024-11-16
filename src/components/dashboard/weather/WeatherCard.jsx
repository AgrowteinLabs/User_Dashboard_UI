import React, { useEffect, useState } from 'react';
import { fetchUser } from "../../dashboard/api/fetchuser";
import { FaTemperatureHigh, FaWind, FaCompass, FaTint } from 'react-icons/fa'; // Import icons for temperature, wind, direction, and humidity
import './WeatherCard.scss';

const WeatherCard = () => {
    const [currentWeather, setCurrentWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userCity, setUserCity] = useState(null);

    useEffect(() => {
        const fetchUserAndWeather = async () => {
            try {
                const userData = await fetchUser();
                if (userData.error) return;

                const city = userData.address.city;
                setUserCity(city);

                const geocodeResponse = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json`
                );
                const geocodeData = await geocodeResponse.json();

                if (geocodeData && geocodeData.length > 0) {
                    const latitude = geocodeData[0].lat;
                    const longitude = geocodeData[0].lon;

                    const weatherResponse = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
                    );
                    const weatherData = await weatherResponse.json();

                    if (weatherData.current_weather) {
                        setCurrentWeather({
                            temperature: weatherData.current_weather.temperature,
                            windSpeed: weatherData.current_weather.windspeed,
                            windDirection: weatherData.current_weather.winddirection,
                            humidity: weatherData.current_weather.relative_humidity,
                            weatherCode: weatherData.current_weather.weathercode,
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching weather data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndWeather();
    }, []);

    return (
        <div className="weather-card">
            <h2 className="weather-title">Current Weather in {userCity || "your location"}</h2>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="weather-details">
                    {currentWeather && (
                        <>
                            <div className="weather-detail">
                                <FaTemperatureHigh className="icon temperature-icon" />
                                <div>
                                    <p className="data-label">Temperature</p>
                                    <p className="data-value">{currentWeather.temperature}°C</p>
                                </div>
                            </div>
                            <div className="weather-detail">
                                <FaWind className="icon wind-icon" />
                                <div>
                                    <p className="data-label">Wind Speed</p>
                                    <p className="data-value">{currentWeather.windSpeed} m/s</p>
                                </div>
                            </div>
                            <div className="weather-detail">
                                <FaCompass className="icon direction-icon" />
                                <div>
                                    <p className="data-label">Wind Direction</p>
                                    <p className="data-value">{currentWeather.windDirection}°</p>
                                </div>
                            </div>
                            <div className="weather-detail">
                                <FaTint className="icon humidity-icon" />
                                <div>
                                    <p className="data-label">Humidity</p>
                                    <p className="data-value">{currentWeather.humidity}%</p>
                                </div>
                            </div>
                            <div className="weather-detail">
                                <span className="icon weather-code-icon">🌤️</span> {/* Example emoji for weather condition */}
                                <div>
                                    <p className="data-label">Weather Condition</p>
                                    <p className="data-value">{currentWeather.weatherCode === 2 ? "Rainy" : "Clear"}</p> {/* Example condition based on code */}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default WeatherCard;
