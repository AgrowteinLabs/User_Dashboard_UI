import React, { useEffect, useState, useContext } from "react";
import AreaCard from "./AreaCard";
import "./AreaCards.scss";
import fetchProducts from "../api/fetchProducts";
import { fetchUser } from "../api/fetchuser";
import { ProductContext } from "../../../context/ProductContext";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import { motion } from 'framer-motion';
import { setControls } from "../api/commands";  // Import the API functions
import {
  Select,
  MenuItem,
  CircularProgress,
  InputLabel,
  FormControl,
  FormControlLabel,
  Switch,
} from "@mui/material";

const AreaCards = () => {
  const { selectedProductUid, setSelectedProductUid } =
    useContext(ProductContext);
  const [products, setProducts] = useState([]);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("Loading location...");
  const [selectedControl, setSelectedControl] = useState(null);
  const [mode, setMode] = useState("manual");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          const savedProductUid = localStorage.getItem("selectedProductUid");
          if (savedProductUid) {
            setSelectedProductUid(savedProductUid);
          } else {
            setSelectedProductUid(data[0].uid);
          }
        } else {
          setProducts([]);
        }

        const userData = await fetchUser();
        if (userData && userData.address) {
          setLocation(userData.address.city);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setSelectedProductUid]);

  useEffect(() => {
    const fetchSelectedProductDetails = async () => {
      if (selectedProductUid) {
        try {
          const product = products.find(
            (product) => product.uid === selectedProductUid
          );
          if (product) {
            setSelectedProductDetails(product);
            localStorage.setItem("selectedProductUid", selectedProductUid);
          }
        } catch (error) {
          console.error("Error fetching product details:", error);
        }
      }
    };
    fetchSelectedProductDetails();
  }, [selectedProductUid, products]);

  const handleThresholdChange = (controlKey, newThreshold) => {
    if (selectedProductDetails) {
      const updatedControls = selectedProductDetails.controls.map((control) =>
        control.controlId === controlKey
          ? {
              ...control,
              threshHold: parseFloat(newThreshold.toFixed(1)),
            }
          : control
      );
      setSelectedProductDetails((prevDetails) => ({
        ...prevDetails,
        controls: updatedControls,
      }));
    }
  };

  const handleControlSelect = (controlId) => {
    setSelectedControl(controlId);
  };

  const handleModeChange = async (event) => {
    const newMode = event.target.checked ? "automatic" : "manual";
    setMode(newMode);

    // Update backend with the selected mode
    try {
      await setControls(newMode, selectedProductUid, "P1", "Pre01", newMode === "automatic" ? "true" : "false");
    } catch (error) {
      console.error("Failed to update mode:", error);
    }
  };

  const handlePowerChange = async (uid, pin, controlId, value) => {
    try {
      await setPower(uid, pin, controlId, value);  // Call the API to set power
    } catch (error) {
      console.error("Failed to set power:", error);
    }
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
          <InputLabel id="product-select-label">Select Product</InputLabel>
          <Select
            labelId="product-select-label"
            value={selectedProductUid || ""}
            onChange={(e) => setSelectedProductUid(e.target.value)}
            displayEmpty
            label="Select Product"
            sx={{
              borderRadius: 2,
              backgroundColor: "#f3f4f6",
              padding: 1,
              color: "#333",
              "& .MuiSelect-icon": {
                color: "#333",
              },
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
            value: location,
          }}
          type="location"
          className="center-card"
        />

        {/* Manual/Automatic Toggle Card */}
        <AreaCard
          colors={["#e4e8ef", "#f29a2e"]}
          cardInfo={{
            title: "Mode",
          }}
          type="mode"
        >
          <FormControlLabel
            control={
              <Switch
                checked={mode === "automatic"}
                onChange={handleModeChange}
              />
            }
            label={mode === "automatic" ? "Automatic" : "Manual"}
            labelPlacement="start"
            sx={{ color: "#333", fontWeight: "bold", padding: "10px" }}
          />
        </AreaCard>
      </div>

      {/* Controls Displayed Only if Automatic Mode is Active */}
      <div className="area-cards-row">
        {mode === "automatic" &&
        selectedProductDetails &&
        selectedProductDetails.controls &&
        selectedProductDetails.controls.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="centered-card"
          >
            <AreaCard
              colors={["#e4e8ef", "#f29a2e"]}
              cardInfo={{
                title: selectedProductDetails.controls.find(
                  (control) => control.controlId === selectedControl
                )?.name,
                value: selectedProductDetails.controls.find(
                  (control) => control.controlId === selectedControl
                )?.threshHold,
                unit: selectedProductDetails.controls.find(
                  (control) => control.controlId === selectedControl
                )?.max
                  ? `Max: ${
                      selectedProductDetails.controls.find(
                        (control) => control.controlId === selectedControl
                      )?.max
                    }, Min: ${
                      selectedProductDetails.controls.find(
                        (control) => control.controlId === selectedControl
                      )?.min
                    }`
                  : "",
              }}
              type="control"
            >
              {/* Control Dropdown at the Top of the Card */}
              <div className="control-selection-container">
                <InputLabel
                  id="control-select-label"
                  sx={{ color: "var(--text-color)", fontWeight: "bold" }}
                >
                  Select Control
                </InputLabel>
                <Select
                  labelId="control-select-label"
                  value={selectedControl || ""}
                  onChange={(e) => handleControlSelect(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 2,
                    backgroundColor: "#f3f4f6",
                    padding: 1,
                    color: "#333",
                    "& .MuiSelect-icon": {
                      color: "#333",
                    },
                    marginBottom: "20px",
                  }}
                >
                  <MenuItem value="" disabled>
                    Select a control
                  </MenuItem>
                  {selectedProductDetails.controls.map((control) => (
                    <MenuItem key={control.controlId} value={control.controlId}>
                      {control.name}
                    </MenuItem>
                  ))}
                </Select>
              </div>

              {/* Control slider and input */}
              <Stack
                spacing={2}
                direction="row"
                sx={{ alignItems: "center", mb: 1 }}
              >
                <Slider
                  aria-label="Control Threshold"
                  value={selectedProductDetails.controls.find(
                    (control) => control.controlId === selectedControl
                  )?.threshHold}
                  min={selectedProductDetails.controls.find(
                    (control) => control.controlId === selectedControl
                  )?.min}
                  max={selectedProductDetails.controls.find(
                    (control) => control.controlId === selectedControl
                  )?.max}
                  step={0.1}
                  onChange={(e, newValue) =>
                    handleThresholdChange(selectedControl, newValue)
                  }
                />
              </Stack>
              <div>
                Threshold:
                <input
                  type="number"
                  step="0.1"
                  value={selectedProductDetails.controls.find(
                    (control) => control.controlId === selectedControl
                  )?.threshHold}
                  onChange={(e) =>
                    handleThresholdChange(selectedControl, e.target.value)
                  }
                  style={{
                    width: "60px",
                    textAlign: "center",
                    marginRight: "10px",
                  }}
                />
                /{" "}
                {
                  selectedProductDetails.controls.find(
                    (control) => control.controlId === selectedControl
                  )?.max
                }
              </div>
            </AreaCard>
          </motion.div>
        ) : (
          <div
            style={{
              fontWeight: "bold",
              fontSize: "1.2rem",
              color: "#333",
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            No controls available
          </div>
        )}
      </div>
    </section>
  );
};

export default AreaCards;
