// AreaCards component
import { useEffect, useState, useContext } from "react";
import AreaCard from "./AreaCard";
import "./AreaCards.scss";
import fetchProducts from "../../../api/fetchProducts";
import fetchUser  from "../../../api/fetchuser";
import { ProductContext } from "../../../context/ProductContext";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import { motion } from "framer-motion";
import { setControls } from "../../../api/setModeAndThreshold";
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
  Typography,
} from "@mui/material";

const AreaCards = () => {
  const { selectedProductUid, setSelectedProductUid } = useContext(ProductContext);
  const [products, setProducts] = useState([]);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("Loading location...");
  const [selectedControl, setSelectedControl] = useState(null);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [mode, setMode] = useState("manual");
  const [threshold, setThreshold] = useState(0);

  const userId = localStorage.getItem("userId");

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
            localStorage.setItem("selectedProductUid", data[0].uid);
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
  }, [setSelectedProductUid]);

  useEffect(() => {
    const fetchSelectedProductDetails = async () => {
      if (userId && selectedProductUid) {
        try {
          const url = import.meta.env.VITE_REACT_APP_API_URL;
          const response = await fetch(
            `${url}/api/v1/user/product/${userId}`
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
            setSelectedProductDetails(selectedProduct);
            if (selectedProduct.controls?.length > 0) {
              setMode(
                selectedProduct.controls.every((control) => control.automate)
                  ? "automate"
                  : "manual"
              );
              setSelectedControl(selectedProduct.controls[0].controlId);
              setSelectedSensor(selectedProduct.controls[0].controlId);
              setThreshold(selectedProduct.controls[0].threshHold || 0);
            }
          }
        } catch (error) {
          console.error("Error fetching product details:", error);
        }
      }
    };

    fetchSelectedProductDetails();
  }, [userId, selectedProductUid]);

  const handleModeChange = async (event) => {
    const newMode = event.target.checked ? "automate" : "manual";
    setMode(newMode);

    const value = newMode === "automate" ? "true" : "false";

    if (selectedProductDetails?.controls) {
      selectedProductDetails.controls.forEach(async (control) => {
        const payload = {
          mode: "automate",
          uid: selectedProductUid,
          pin: control.pin,
          value: value,
          controlId: control.controlId,
        };

        try {
          await setControls(payload);
        } catch (error) {
          console.error(`Failed to update mode for ${control.controlId}:`, error);
        }
      });

      Swal.fire({
        icon: "success",
        title: "Mode updated successfully!",
        text: `Mode is now set to ${newMode}`,
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
      const control = selectedProductDetails.controls.find(
        (c) => c.controlId === selectedControl
      );

      if (!control) {
        Swal.fire({
          icon: "error",
          title: "Control Not Found",
          text: "Selected control not found",
          timer: 3000,
        });
        return;
      }

      try {
        await setControls({
          mode: "threshold",
          uid: selectedProductUid,
          pin: control.pin,
          value: threshold,
          controlId: control.controlId,
        });

        Swal.fire({
          icon: "success",
          title: "Threshold Updated!",
          text: `${control.name} threshold set to ${threshold}`,
          timer: 3000,
        });

        // Refresh product details
        const url = import.meta.env.VITE_REACT_APP_API_URL;
        const response = await fetch(
          `${url}/api/v1/user/product/${userId}`
        );
        const productData = await response.json();
        setSelectedProductDetails(productData.find(
          (product) => product.uid === selectedProductUid
        ));
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "Failed to update threshold",
          timer: 3000,
        });
      }
    }
  };

  const handleToggleSensor = async () => {
    if (!selectedSensor || !selectedProductDetails) return;

    const control = selectedProductDetails.controls.find(
      (c) => c.controlId === selectedSensor
    );

    if (!control) {
      Swal.fire({
        icon: "error",
        title: "Control Not Found",
        text: "Selected control not found",
        timer: 3000,
      });
      return;
    }

    try {
      const newStatus = control.state === "ON" ? "off" : "on";
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const response = await fetch(`${url}/api/v1/command/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          uid: selectedProductUid,
          pin: control.pin,
          controlId: control.controlId,
          value: newStatus
        })
      });

      if (!response.ok) throw new Error('Failed to update control');

      // Update local state immediately
      const updatedControls = selectedProductDetails.controls.map(c => 
        c.controlId === control.controlId 
          ? { ...c, state: newStatus === "on" ? "ON" : "OFF" }
          : c
      );

      setSelectedProductDetails({
        ...selectedProductDetails,
        controls: updatedControls
      });

      Swal.fire({
        icon: "success",
        title: "Control Updated!",
        text: `${control.name} turned ${newStatus.toUpperCase()}`,
        timer: 3000,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.message || "Failed to update control",
        timer: 3000,
      });
    }
  };

  const handleControlSelect = (controlId) => {
    setSelectedControl(controlId);
    const control = selectedProductDetails?.controls?.find(c => c.controlId === controlId);
    if (control) setThreshold(control.threshHold || 0);
  };

  const handleSensorSelect = (controlId) => {
    setSelectedSensor(controlId);
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

  const currentSensor = selectedProductDetails?.controls?.find(
    (c) => c.controlId === selectedSensor
  );

  return (
    <section className="content-area-cards">
      <div className="dropdown-container">
        <FormControl fullWidth>
          <InputLabel id="product-select-label">Select Product</InputLabel>
          <br />
          <Select
            labelId="product-select-label"
            value={selectedProductUid || ""}
            onChange={(e) => {
              const selectedUid = e.target.value;
              setSelectedProductUid(selectedUid);
              localStorage.setItem("selectedProductUid", selectedUid);
            }}
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
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: "#03856d" },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#03856d",
                    },
                  }}
                />
              }
              label={
                <Typography variant="h6" sx={{
                  color: mode === "automate" ? "#03856d" : "#f29a2e",
                  fontWeight: "bold"
                }}>
                  {mode.toUpperCase()}
                </Typography>
              }
              labelPlacement="start"
              sx={{ padding: "10px" }}
            />
          </div>
        </AreaCard>
      </div>

      <div className="area-cards-row">
        {mode === "automate" && selectedProductDetails?.controls?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="centered-card"
          >
            <AreaCard
              colors={["#e4e8ef", "#f29a2e"]}
              cardInfo={{
                title: currentControl?.name,
                value: currentControl?.threshHold,
                unit: currentControl?.max ? `(Range: ${currentControl.min}-${currentControl.max})` : ""
              }}
              type="control"
            >
              <div className="control-selection-container">
                <InputLabel sx={{ fontWeight: "bold" }}>Select Control</InputLabel>
                <Select
                  value={selectedControl || ""}
                  onChange={(e) => handleControlSelect(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: "#f3f4f6",
                    marginBottom: 2,
                  }}
                >
                  {selectedProductDetails.controls.map((control) => (
                    <MenuItem key={control.controlId} value={control.controlId}>
                      {control.name} ({control.state})
                    </MenuItem>
                  ))}
                </Select>
              </div>

              <Stack spacing={2} sx={{ mb: 2 }}>
                <Slider
                  value={threshold}
                  min={currentControl?.min}
                  max={currentControl?.max}
                  step={0.1}
                  onChange={(_, val) => handleThresholdChange(val)}
                />
                <div>
                  Threshold: 
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => handleThresholdChange(e.target.value)}
                    style={{ width: 60, marginLeft: 10 }}
                  />
                </div>
              </Stack>

              <Button
                variant="contained"
                onClick={handleSaveThreshold}
                fullWidth
              >
                Save Threshold
              </Button>
            </AreaCard>
          </motion.div>
        )}

        {selectedProductDetails?.controls?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="centered-card"
          >
            <AreaCard
              colors={["#e4e8ef", "#475be8"]}
              cardInfo={{ title: "Control Switch" }}
              type="sensor-control"
            >
              <div className="control-selection-container">
                <InputLabel sx={{ fontWeight: "bold" }}>Select Control</InputLabel>
                <Select
                  value={selectedSensor || ""}
                  onChange={(e) => handleSensorSelect(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: "#f3f4f6",
                    marginBottom: 2,
                  }}
                >
                  {selectedProductDetails.controls.map((control) => (
                    <MenuItem key={control.controlId} value={control.controlId}>
                      {control.name} ({control.state})
                    </MenuItem>
                  ))}
                </Select>
              </div>

              <div className="sensor-control-container">
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Current Status: {currentSensor?.state || "UNKNOWN"}
                </Typography>
                <Button
                  variant="contained"
                  color={currentSensor?.state === "ON" ? "error" : "success"}
                  onClick={handleToggleSensor}
                  fullWidth
                >
                  TURN {currentSensor?.state === "ON" ? "OFF" : "ON"}
                </Button>
              </div>
            </AreaCard>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default AreaCards;