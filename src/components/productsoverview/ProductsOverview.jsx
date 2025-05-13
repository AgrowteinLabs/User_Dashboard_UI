import  { useState, useEffect } from "react";
// import { CircularProgress } from "@mui/material";
import { useMqttSensorData } from "../../hooks/useMqttSensorData"; // Your MQTT hook
import Skeleton from "react-loading-skeleton"; // Skeleton Loader
import "react-loading-skeleton/dist/skeleton.css"; // Import CSS for Skeleton
import  fetchProducts  from "../../api/fetchProducts"; // Your fetchProducts API
import { PropTypes } from 'prop-types';
import "./ProductsOverview.scss"; // Your CSS file

// Material UI Icons
import { DeviceThermostat, AcUnit, Water, FilterHdr } from '@mui/icons-material';

const sensorIconMap = {
  Temperature: <DeviceThermostat />,
  Temperature_1: <DeviceThermostat />,
  Temperature_2: <DeviceThermostat />,
  Humidity: <AcUnit />,
  Humidity_1: <AcUnit />,
  Humidity_2: <AcUnit />,
  CO2: <FilterHdr />,
  CO2_Sensor_1: <FilterHdr />,
  CO2_Sensor_2: <FilterHdr />,
  CO2_Sensor_3: <FilterHdr />,
  CO2_Sensor_4: <FilterHdr />,
  Water_Used: <Water />
};

const ProductsOverview = () => {
  const [products, setProducts] = useState([]); // State to store all products
  const [loading, setLoading] = useState(true); // Loading state while fetching
  const [error, setError] = useState(null); // Error handling state

  useEffect(() => {
    const getProducts = async () => {
      try {
        setLoading(true); // Start loading
        setError(null); // Clear previous errors

        // Fetch products for the user
        const products = await fetchProducts();
        if (products && products.length > 0) {
          setProducts(products); // Store all products
        } else {
          setError("No products available.");
        }
      } catch (err) {
        setError("Error fetching products: " + err.message);
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false); // Stop loading after fetching
      }
    };

    getProducts(); // Call the fetch function
  }, []); // Fetch products only once when the component mounts

  // Show loading skeleton while waiting for data or connection
  if (loading) {
    return (
      <div className="loading-spinner">
        <Skeleton count={3} height={200} width="100%" />
      </div>
    );
  }

  // Show error if there's any issue fetching products
  if (error) {
    return (
      <div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="products-overview">
      <h2>Products Overview - Sensor Readings</h2>

      {/* Display sensor data for all products */}
      <div className="sensor-list">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductSensors key={product.uid} product={product} />
          ))
        ) : (
          <p>No products to display.</p>
        )}
      </div>
    </div>
  );
};

// Child component to handle MQTT data for each product
const ProductSensors = ({ product }) => {
  const { uid, alias } = product; // Use alias for product name
  const { message, connected, loading: mqttLoading, error: mqttError, handleRetry } = useMqttSensorData(uid);

  // Show loading skeleton while waiting for MQTT data
  if (mqttLoading) {
    return (
      <div className="loading-spinner">
        <Skeleton count={3} height={200} width="100%" />
      </div>
    );
  }

  // Show error if MQTT data fetch fails
  if (mqttError) {
    return (
      <div>
        <p>{mqttError}</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  // Show disconnected message if MQTT connection fails
  if (!connected) {
    return <div>Disconnected from MQTT for {alias}. Trying to reconnect...</div>;
  }

  return (
    <div className="sensor-card">
      <h3>
        <DeviceThermostat /> {/* Example: Alias icon for product */}
        {alias}
      </h3> 
      
      <div className="sensor-info">
        {message ? (
          Object.entries(message).map(([sensorName, sensorValue], index) => (
            <div key={index} className="sensor-info-item">
              <h4>
                {sensorIconMap[sensorName] || <DeviceThermostat />} {/* Display icon based on sensor name */}
                {sensorName}
              </h4>
              <p className={typeof sensorValue === "string" && sensorValue.includes("er") ? "error-text" : "normal"}>
                {sensorValue !== null
                  ? typeof sensorValue === "string" && sensorValue.includes("er")
                    ? `Error: ${sensorValue}` // If it's an error code (e.g., "th-er")
                    : typeof sensorValue === "number"
                    ? sensorValue.toFixed(2) // Limit numeric values to 2 decimal points
                    : sensorValue // If not a number, show as it is
                  : "No Data"}
              </p>
            </div>
          ))
        ) : (
          <p>No sensor data available for {alias}.</p>
        )}
      </div>
    </div>
  );
};

// Prop validation for ProductSensors component
ProductSensors.propTypes = {
  product: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    alias: PropTypes.string.isRequired // Make alias required for proper display
  }).isRequired
};

export default ProductsOverview;
