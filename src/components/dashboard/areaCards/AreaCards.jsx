// AreaCards component
import React, { useEffect, useState, useContext } from "react";
import AreaCard from "./AreaCard";
import "./AreaCards.scss";
import fetchProducts from "../api/fetchProducts";
import { fetchUser } from "../api/fetchuser";
import { ProductContext } from "../../../context/ProductContext";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import { motion } from "framer-motion";
import { setControls, setPower } from "../api/commands";
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          const savedProductUid = localStorage.getItem("selectedProductUid");
          setSelectedProductUid(savedProductUid || data[0].uid);
        }
        const userData = await fetchUser();
        setLocation(userData?.address?.city || "Location not available");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setSelectedProductUid]);

  useEffect(() => {
    const fetchSelectedProductDetails = async () => {
      if (selectedProductUid) {
        const product = products.find((p) => p.uid === selectedProductUid);
        setSelectedProductDetails(product);
        localStorage.setItem("selectedProductUid", selectedProductUid);
      }
    };
    fetchSelectedProductDetails();
  }, [selectedProductUid, products]);

  const handleThresholdChange = async (controlKey, newValue) => {
    if (!selectedProductDetails) return;

    const originalControls = [...selectedProductDetails.controls];
    try {
      // Optimistic update
      const updatedControls = originalControls.map((control) =>
        control.controlId === controlKey
          ? { ...control, threshHold: parseFloat(newValue.toFixed(1)) }
          : control
      );
      setSelectedProductDetails((prev) => ({ ...prev, controls: updatedControls }));

      // API call
      const control = updatedControls.find((c) => c.controlId === controlKey);
      await setControls("threshhold", {
        uid: selectedProductUid,
        pin: control.pin,
        controlId: controlKey,
        value: parseFloat(newValue.toFixed(1)),
        mode: "threshhold",
      });
    } catch (error) {
      console.error("Threshold update failed:", error);
      setSelectedProductDetails((prev) => ({ ...prev, controls: originalControls }));
    }
  };

  const handleModeChange = async (event) => {
    if (!selectedControl || !selectedProductDetails) return;

    const originalControls = [...selectedProductDetails.controls];
    try {
      const newAutomate = event.target.checked;
      // Optimistic update
      const updatedControls = originalControls.map((control) =>
        control.controlId === selectedControl
          ? { ...control, automate: newAutomate }
          : control
      );
      setSelectedProductDetails((prev) => ({ ...prev, controls: updatedControls }));

      // API call
      const control = updatedControls.find((c) => c.controlId === selectedControl);
      await setControls("automate", {
        uid: selectedProductUid,
        pin: control.pin,
        controlId: selectedControl,
        value: `${newAutomate}`,
        mode: "automate",
      });
    } catch (error) {
      console.error("Mode update failed:", error);
      setSelectedProductDetails((prev) => ({ ...prev, controls: originalControls }));
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <CircularProgress color="primary" />
      </div>
    );
  }

  const currentControl = selectedProductDetails?.controls?.find(
    (c) => c.controlId === selectedControl
  );

  return (
    <section className="content-area-cards">
      <div className="dropdown-container">
        <FormControl fullWidth>
          <InputLabel id="product-select-label">Select Product</InputLabel>
          <Select
            labelId="product-select-label"
            value={selectedProductUid || ""}
            onChange={(e) => setSelectedProductUid(e.target.value)}
            label="Select Product"
            sx={{
              borderRadius: 2,
              backgroundColor: "#f3f4f6",
              padding: 1,
              color: "#333",
              "& .MuiSelect-icon": { color: "#333" },
            }}
          >
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
          cardInfo={{ title: "Current Time" }}
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

        <AreaCard
          colors={["#e4e8ef", "#f29a2e"]}
          cardInfo={{ title: "Mode" }}
          type="mode"
        >
          <FormControlLabel
            control={
              <Switch
                checked={currentControl?.automate || false}
                onChange={handleModeChange}
                disabled={!selectedControl}
              />
            }
            label={currentControl?.automate ? "Automatic" : "Manual"}
            labelPlacement="start"
            sx={{ color: "#333", fontWeight: "bold", padding: "10px" }}
          />
        </AreaCard>
      </div>

      <div className="area-cards-row">
        {selectedProductDetails?.controls?.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="centered-card"
          >
            <AreaCard
              colors={["#e4e8ef", "#f29a2e"]}
              cardInfo={{
                title: currentControl?.name,
                value: currentControl?.threshHold,
                unit: currentControl?.max
                  ? `Max: ${currentControl.max}, Min: ${currentControl.min}`
                  : "",
              }}
              type="control"
            >
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
                  onChange={(e) => setSelectedControl(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: "#f3f4f6",
                    padding: 1,
                    color: "#333",
                    "& .MuiSelect-icon": { color: "#333" },
                    marginBottom: "20px",
                  }}
                >
                  {selectedProductDetails.controls.map((control) => (
                    <MenuItem key={control.controlId} value={control.controlId}>
                      {control.name}
                    </MenuItem>
                  ))}
                </Select>
              </div>

              <Stack spacing={2} direction="row" sx={{ alignItems: "center", mb: 1 }}>
                <Slider
                  aria-label="Control Threshold"
                  value={currentControl?.threshHold || 0}
                  min={currentControl?.min}
                  max={currentControl?.max}
                  step={0.1}
                  onChange={(_, newValue) =>
                    handleThresholdChange(selectedControl, newValue)
                  }
                  disabled={!selectedControl}
                />
              </Stack>
              <div>
                Threshold:
                <input
                  type="number"
                  step="0.1"
                  value={currentControl?.threshHold || 0}
                  onChange={(e) =>
                    handleThresholdChange(selectedControl, e.target.value)
                  }
                  style={{
                    width: "60px",
                    textAlign: "center",
                    marginRight: "10px",
                  }}
                  disabled={!selectedControl}
                />
                / {currentControl?.max}
              </div>
            </AreaCard>
          </motion.div>
        ) : (
          <div className="no-controls-message">No controls available</div>
        )}
      </div>
    </section>
  );
};

export default AreaCards;