import React, { useEffect, useState, useContext } from "react";
import AreaCard from "./AreaCard";
import "./AreaCards.scss";
import fetchProducts from "../api/fetchProducts";
import { fetchUser } from "../api/fetchuser";
import { ProductContext } from "../../../context/ProductContext";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import { Select, MenuItem, CircularProgress, InputLabel, FormControl } from "@mui/material";

const AreaCards = () => {
  const { selectedProductUid, setSelectedProductUid } = useContext(ProductContext);
  const [products, setProducts] = useState([]);
  const [selectedControls, setSelectedControls] = useState([]); // Initializing selectedControls
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("Loading location...");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch products data
        const data = await fetchProducts();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          if (!selectedProductUid) {
            setSelectedProductUid(data[0].uid);
          }
        } else {
          setProducts([]);
        }

        // Fetch user data to get the location (city)
        const userData = await fetchUser();
        if (userData && userData.address) {
          setLocation(userData.address.city); // Set city as the location
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedProductUid, setSelectedProductUid]);

  // Handle the changes in control thresholds
  const handleThresholdChange = (controlKey, newThreshold) => {
    setSelectedControls((prevControls) =>
      prevControls.map(([key, control]) =>
        key === controlKey
          ? [
              key,
              {
                ...control,
                threshHold: parseFloat(newThreshold.toFixed(1)),
              },
            ]
          : [key, control]
      )
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <CircularProgress color="primary" />
      </div>
    );
  }

  return (
    <section className="content-area-cards">
      <div className="dropdown-container">
        <FormControl fullWidth>
          <InputLabel id="product-select-label" sx={{ Color: 'var(--text-color)', padding: '0 8px', color: 'var(--text-color)' }}>
            Select Product
          </InputLabel>
          <Select
            labelId="product-select-label"
            value={selectedProductUid || ""}
            onChange={(e) => setSelectedProductUid(e.target.value)}
            displayEmpty
            label="Select Product"
            sx={{
              borderRadius: 2,
              backgroundColor: 'var(--secondary-color)',
              padding: 1,
              color: 'var(--text-color)', // Change text color of selected item
              "& .MuiSelect-icon": {
                color: 'var(--text-color)', // Change icon color
              }
            }}
          >
            <MenuItem value="" disabled>
              Choose a product
            </MenuItem>
            {products.map((product) => (
              <MenuItem key={product._id} value={product.uid}>
                {product.alias}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
            title: "Current Location",
            value: location, // Display the city name
          }}
          type="location"
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
                  step={0.1}
                  onChange={(e, newValue) => handleThresholdChange(controlKey, newValue)}
                />
              </Stack>
              <div>
                Threshold:
                <input
                  type="number"
                  step="0.1"
                  value={control.threshHold}
                  onChange={(e) => handleThresholdChange(controlKey, e.target.value)}
                  style={{ width: "60px", textAlign: "center", marginRight: "10px" }}
                />
                / {control.max}
              </div>
            </AreaCard>
          ))
        ) : (
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-color)', textAlign: 'center' }}>
            No controls available
          </div>
        )}
      </div>
    </section>
  );
};

export default AreaCards;
