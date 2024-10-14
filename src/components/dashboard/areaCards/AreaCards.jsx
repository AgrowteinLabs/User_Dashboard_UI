import React, { useEffect, useState, useContext } from "react";
import AreaCard from "./AreaCard";
import "./AreaCards.scss";
import fetchProducts from "../api/fetchProducts";
import { ProductContext } from "../../../context/ProductContext";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";

const AreaCards = () => {
  const { selectedProductUid, setSelectedProductUid } = useContext(ProductContext);
  const [products, setProducts] = useState([]);
  const [selectedControls, setSelectedControls] = useState([]);
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          if (!selectedProductUid) {
            setSelectedProductUid(data[0].uid);
          }
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to load products.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedProductUid, setSelectedProductUid]);

  useEffect(() => {
    if (products.length > 0) {
      const selectedProduct = products.find((product) => product.uid === selectedProductUid);
      if (selectedProduct) {
        if (Array.isArray(selectedProduct.controls)) {
          setSelectedControls(
            selectedProduct.controls.map((control) => Object.entries(control)[0])
          );
        } else {
          setSelectedControls([]);
        }
        if (Array.isArray(selectedProduct.sensors)) {
          setSelectedSensors(
            selectedProduct.sensors.map((sensor) => ({
              name: sensor.sensorId?.name || "Unknown Sensor",
              state: sensor.state,
              unit: sensor.sensorId?.unit || "",
            }))
          );
        } else {
          setSelectedSensors([]);
        }
      } else {
        setSelectedControls([]);
        setSelectedSensors([]);
      }
    }
  }, [selectedProductUid, products]);

  const handleThresholdChange = (controlKey, newThreshold) => {
    setSelectedControls((prevControls) =>
      prevControls.map(([key, control]) =>
        key === controlKey
          ? [
              key,
              {
                ...control,
                threshHold: parseFloat(newThreshold.toFixed(1)), // Ensure the threshold is a float with 1 decimal point
              },
            ]
          : [key, control]
      )
    );
  };

  const handleInputChange = (controlKey, value) => {
    const newValue = parseFloat(value);
    if (!isNaN(newValue)) {
      handleThresholdChange(controlKey, newValue);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!products.length) {
    return (
      <section className="content-area-cards">
        <div className="dropdown-container">No products available</div>
      </section>
    );
  }

  return (
    <section className="content-area-cards">
      <div className="dropdown-container">
        <select
          value={selectedProductUid || ""}
          onChange={(e) => {
            const selectedUid = e.target.value;
            setSelectedProductUid(selectedUid);
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

        {selectedControls.length > 0 ? (
          selectedControls.map(([controlKey, control], index) => (
            <AreaCard
              key={index}
              colors={["#e4e8ef", "#f29a2e"]}
              cardInfo={{
                title: control.name,
                value: control.threshHold,
                unit: control.max ? `Max: ${control.max}, Min: ${control.min}` : "",
              }}
              type="control"
            >
              <Stack spacing={2} direction="row" sx={{ alignItems: "center", mb: 1 }}>
                <Slider
                  aria-label="Control Threshold"
                  value={control.threshHold}
                  min={control.min}
                  max={control.max}
                  step={0.1} // Allowing up to one decimal point
                  onChange={(e, newValue) => handleThresholdChange(controlKey, newValue)}
                />
              </Stack>
              <div>
                Threshold:
                <input
                  type="number"
                  step="0.1"
                  value={control.threshHold} // Directly binding the numeric value
                  onChange={(e) => handleInputChange(controlKey, e.target.value)}
                  style={{ width: "60px", textAlign: "center", marginRight: "10px" }}
                /> 
                / {control.max}
              </div>
            </AreaCard>
          ))
        ) : (
          <div>No controls available</div>
        )}
      </div>
    </section>
  );
};

export default AreaCards;