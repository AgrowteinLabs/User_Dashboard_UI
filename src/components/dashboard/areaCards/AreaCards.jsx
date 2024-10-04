import React, { useEffect, useState, useContext } from "react";
import AreaCard from "./AreaCard";
import "./AreaCards.scss";
import fetchProducts from "../api/fetchProducts";
import { ProductContext } from "../../../context/ProductContext";

const AreaCards = () => {
  const { selectedProductUid, setSelectedProductUid } = useContext(ProductContext);
  const [products, setProducts] = useState([]);
  const [selectedControls, setSelectedControls] = useState([]);
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [error, setError] = useState(null); // Error state for error handling
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch products on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Start loading
      try {
        const data = await fetchProducts();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          // Set default product if none is selected
          // alert(selectedProductUid);
          if (!selectedProductUid) {
            setSelectedProductUid(data[0].uid);
            // alert("Selected product: " + data[0].alias); // Alert default selected product
          }
        } else {
          setProducts([]); // If the data is not an array or is empty, ensure the products array is empty
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to load products."); // Set the error message
        setProducts([]); // Set an empty array if there was an error
      } finally {
        setLoading(false); // Stop loading
      }
    };
    fetchData();
  }, [selectedProductUid, setSelectedProductUid]);

  // Update sensors and controls when the selected product changes
  useEffect(() => {
    if (products.length > 0) {
      const selectedProduct = products.find((product) => product.uid === selectedProductUid);

      if (selectedProduct) {
        // Safeguard for controls
        if (Array.isArray(selectedProduct.controls)) {
          setSelectedControls(
            selectedProduct.controls.map((control) => Object.entries(control)[0])
          );
        } else {
          setSelectedControls([]); // Ensure controls are empty if none are available
        }

        // Safeguard for sensors
        if (Array.isArray(selectedProduct.sensors)) {
          setSelectedSensors(
            selectedProduct.sensors.map((sensor) => ({
              name: sensor.sensorId?.name || "Unknown Sensor", // Fallback to 'Unknown Sensor'
              state: sensor.state,
              unit: sensor.sensorId?.unit || "", // Fallback to empty string if unit is undefined
            }))
          );
        } else {
          setSelectedSensors([]); // Ensure sensors are empty if none are available
        }
      } else {
        setSelectedControls([]); // Reset if no selected product
        setSelectedSensors([]); // Reset if no selected product
      }
    }
  }, [selectedProductUid, products]);

  // Handling edge cases if no products or no sensors/controls are available
  if (loading) {
    return <div>Loading...</div>; // Show loading state
  }

  if (error) {
    return <div>{error}</div>; // Display error message if fetching products failed
  }

  if (!products.length) {
    return( 
      <section className="content-area-cards">
      <div className="dropdown-container">
      No products available
      </div>
      </section>
     ); 
  }

  return (
    <section className="content-area-cards">
      <div className="dropdown-container">
        <select
          value={selectedProductUid || ""} // Use empty string if no product is selected
          onChange={(e) => {
            const selectedUid = e.target.value;
            setSelectedProductUid(selectedUid); // Set the selected product's UID
            const selectedProduct = products.find(product => product.uid === selectedUid);
            
          }}
        >
          <option value="" disabled>
            Select a product
          </option>
          {products.map((product) => (
            <option key={product._id} value={product.uid}>
              {product.alias}
            </option>
          ))}
        </select>
      </div>

      <div className="area-cards-row">
        <AreaCard
          colors={["#e4e8ef", "#475be8"]}
          cardInfo={{
            title: "Current Time",
          }}
          type="time"
        />
        <AreaCard
          colors={["#e4e8ef", "#4ce13f"]}
          cardInfo={{
            title: "Current Temperature",
          }}
          type="temperature"
          className="center-card"
        />

        {/* Uncomment this section if you want to display sensors */}
        {/* {selectedSensors.length > 0 ? (
          selectedSensors.map((sensor, index) => (
            <AreaCard
              key={index}
              colors={["#e4e8ef", sensor.state === "ON" ? "#4ce13f" : "#f29a2e"]}
              cardInfo={{
                title: sensor.name,
                value: sensor.state,
                unit: sensor.unit,
              }}
              type="sensor"
            />
          ))
        ) : (
          <div>No sensors available</div>
        )} */}

        {selectedControls.length > 1 ? (
          alert(selectedControls.length),
          selectedControls.map(([controlKey, controlName], index) => (
            <AreaCard
              key={index}
              colors={["#e4e8ef", "#f29a2e"]}
              cardInfo={{
                title: controlName,
              }}
              type="power"
              controlName={controlName}
              controlKey={controlKey}
            />
          ))
        ) : (
          <div></div>
        )}
      </div>
    </section>
  );
};

export default AreaCards;