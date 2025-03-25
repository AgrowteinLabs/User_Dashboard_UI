import { useEffect, useState, useContext } from "react";
import AreaCard from "./AreaCard";
import "./AreaCards.scss";
import fetchProducts from "../api/fetchProducts";
import { fetchUser } from "../api/fetchuser";
import { ProductContext } from "../../../context/ProductContext";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import { motion } from "framer-motion";
import { setControls } from "../api/setModeAndThreshold";
import Swal from "sweetalert2";
import {
  Select,
  MenuItem,
  CircularProgress,
  InputLabel,
  FormControl,
  FormControlLabel,
  Switch,
  Button,
  } from "@mui/material";

const AreaCards = () => {
  const { selectedProductUid, setSelectedProductUid } =
    useContext(ProductContext);
  const [products, setProducts] = useState([]);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("Loading location...");
  const [selectedControl, setSelectedControl] = useState(null);
  const [mode, setMode] = useState("automate");
  const [threshold, setThreshold] = useState(0); // Store the threshold value

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);

          // Check if a product is already saved in localStorage
          const savedProductUid = localStorage.getItem("selectedProductUid");
          if (savedProductUid) {
            setSelectedProductUid(savedProductUid);
          } else {
            // If no product is saved, use the first product in the list
            setSelectedProductUid(data[0].uid);
            localStorage.setItem("selectedProductUid", data[0].uid); // Store it in localStorage
          }
        } else {
          setProducts([]);
        }

        const userData = await fetchUser();
        setLocation(userData?.address?.city || "Location not available");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setSelectedProductUid]); // Add setSelectedProductUid as dependency

  useEffect(() => {
    const fetchSelectedProductDetails = async () => {
      if (userId && selectedProductUid) {
        try {
          const response = await fetch(
            `https://apiv2.agrowtein.com/api/v1/user/product/${userId}`
          );
          if (!response.ok) {
            console.error("API error:", response.statusText);
            return;
          }

          const productData = await response.json();
          const selectedProduct = productData.find(
            (product) => product.uid === selectedProductUid
          );

          if (selectedProduct) {
            if (
              selectedProduct.controls &&
              selectedProduct.controls.length > 0
            ) {
              setSelectedProductDetails(selectedProduct);
              setMode(
                selectedProduct.controls.every((control) => control.automate)
                  ? "automate"
                  : "manual"
              );
            } else {
              console.warn("No controls available for the selected product.");
              setSelectedProductDetails(selectedProduct);
            }
          } else {
            console.error("No valid product data found for the selected UID.");
          }
        } catch (error) {
          console.error("Error fetching product details:", error);
        }
      }
    };

    fetchSelectedProductDetails();
  }, [userId, selectedProductUid]);

  // Handle mode change (Automate/Bypass)
const handleModeChange = async (event) => {
  const newMode = event.target.value; // Get the mode from the selected option
  setMode(newMode); // Update the mode state

  // Set the value as "true" when the mode is ON, "false" when OFF
  const value = newMode === "automate" || newMode === "bypass" ? "true" : "false";

  if (selectedProductDetails && selectedProductDetails.controls) {
    selectedProductDetails.controls.forEach(async (control) => {
      const pin = control.pin;
      const controlId = control.controlId;

      if (!pin || !controlId) return;

      const payload = {
        mode: newMode, // Send the correct mode ("automate" or "bypass")
        uid: selectedProductUid,
        pin: pin,
        value: value, // "true" or "false" based on the mode
        controlId: controlId,
      };

      try {
        await setControls(payload);
        console.log(`${controlId} set to ${newMode}`);
      } catch (error) {
        console.error(`Failed to update mode for control ${controlId}:`, error);
      }
    });

    Swal.fire({
      icon: "success",
      title: `Mode updated to ${newMode}`,
      text: `Device is now in ${newMode} mode`,
      timer: 3000,
      showConfirmButton: false,
    });
  }
};


  const handleThresholdChange = (newThreshold) => {
    setThreshold(Number(newThreshold));
  };

  const handleSaveThreshold = async () => {
    if (selectedProductDetails && selectedControl) {
      const selectedControlDetails = selectedProductDetails.controls.find(
        (control) => control.controlId === selectedControl
      );

      // Check if control details exist for the selected control
      if (!selectedControlDetails) {
        console.error("Selected control details not found");
        Swal.fire({
          icon: "error",
          title: "Control Not Found",
          text: "The selected control details could not be found. Please select a valid control.",
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }

      // Extract pin and controlId from the selected control
      const pin = selectedControlDetails.pin;
      const controlId = selectedControlDetails.controlId;

      // Ensure pin and controlId are not undefined or empty
      if (!pin || !controlId) {
        console.error("Pin or ControlId is missing for the selected control");
        Swal.fire({
          icon: "error",
          title: "Invalid Control",
          text: "Pin or ControlId is missing for the selected control. Please select a valid control.",
          timer: 3000,
          showConfirmButton: false,
        });
        return; // Stop further execution if pin or controlId are missing
      }

      // Formulate the payload with the correct values
      const payload = {
        mode: "threshold", // Mode is set to "threshold" for updating the threshold
        uid: selectedProductUid, // Product UID
        pin: pin, // Pin
        value: threshold, // The value to be updated (threshold)
        controlId: controlId, // The selected control ID
      };

      console.log("Formatted Payload for Threshold:", payload); // Debugging payload structure

      try {
        // Send the payload to setControls
        await setControls(payload);
        console.log("Threshold saved:", threshold);

        // Show success message using Swal
        Swal.fire({
          icon: "success",
          title: "Threshold updated successfully!",
          text: `Threshold is set to ${threshold}`,
          timer: 3000,
          showConfirmButton: false,
        });

        // After the threshold is successfully updated, refetch the product details
        const fetchSelectedProductDetails = async () => {
          if (userId && selectedProductUid) {
            try {
              const response = await fetch(
                `https://apiv2.agrowtein.com/api/v1/user/product/${userId}`
              );
              if (!response.ok) {
                console.error("API error:", response.statusText);
                return;
              }

              const productData = await response.json();
              const selectedProduct = productData.find(
                (product) => product.uid === selectedProductUid
              );

              if (selectedProduct) {
                setSelectedProductDetails(selectedProduct); // Update the product details
              } else {
                console.error(
                  "No valid product data found for the selected UID."
                );
              }
            } catch (error) {
              console.error("Error fetching product details:", error);
            }
          }
        };

        await fetchSelectedProductDetails(); // Trigger the refetch after the update
      } catch (error) {
        console.error("Failed to update threshold:", error);
        Swal.fire({
          icon: "error",
          title: "Error updating threshold",
          text: "There was an issue updating the threshold. Please try again later.",
          timer: 3000,
          showConfirmButton: false,
        });
      }
    }
  };

  
  
  

  

  const handleControlSelect = (controlId) => {
    setSelectedControl(controlId);
    setThreshold(
      selectedProductDetails.controls.find(
        (control) => control.controlId === controlId
      )?.threshHold || 0
    );
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
            onChange={(e) => {
              const selectedUid = e.target.value;
              setSelectedProductUid(selectedUid); // Set the state
              localStorage.setItem("selectedProductUid", selectedUid); // Save in localStorage
            }}
            displayEmpty
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
          colors={["#03856d", "#03856d"]}
          cardInfo={{ title: "Current Location", value: location }}
          type="location"
          className="center-card"
        />

        <AreaCard
          colors={["#e4e8ef", "#f29a2e"]}
          cardInfo={{ title: "Mode" }}
          type="mode"
        >
          <div className="mode-toggle-container">
            <FormControlLabel
              control={
                <Switch
                  checked={mode === "automate"}
                  onChange={handleModeChange}
                  value="automate"
                  label="Automate"
                />
              }
              label="Automate Mode"
            />
                        <FormControlLabel
              control={
                <Switch
                  checked={mode === "bypass"}
                  onChange={handleModeChange}
                  value="bypass"
                  label="Bypass"
                />
              }
              label="Bypass Mode"
            />
          </div>
        </AreaCard>
      </div>

      <div className="area-cards-row">
        {mode === "automate" &&
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
                  Select <br /> Control
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

              <Stack
                spacing={2}
                direction="row"
                sx={{ alignItems: "center", mb: 1 }}
              >
                <Slider
                  aria-label="Control Threshold"
                  value={Number(threshold)}
                  min={
                    selectedProductDetails.controls.find(
                      (control) => control.controlId === selectedControl
                    )?.min
                  }
                  max={
                    selectedProductDetails.controls.find(
                      (control) => control.controlId === selectedControl
                    )?.max
                  }
                  step={0.1}
                  onChange={(e, newValue) => handleThresholdChange(newValue)}
                />
              </Stack>
              <div>
                Threshold:
                <input
                  type="number"
                  step="0.1"
                  value={threshold}
                  onChange={(e) => handleThresholdChange(e.target.value)}
                  style={{
                    width: "60px",
                    textAlign: "center",
                    marginRight: "10px",
                  }}
                  disabled={!selectedControl}
                />
                / {currentControl?.max}
              </div>

              <Button
                variant="contained"
                onClick={handleSaveThreshold}
                sx={{ marginTop: "10px" }}
              >
                Save Threshold
              </Button>
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