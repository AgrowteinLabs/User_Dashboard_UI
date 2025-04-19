// AreaCards.jsx
import { useEffect, useState, useContext, useRef } from "react";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  Slider,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsRemoteIcon from "@mui/icons-material/SettingsRemote";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import { motion } from "framer-motion";
import { ProductContext } from "../../../context/ProductContext";
import fetchProducts from "../../../api/fetchProducts";
import fetchUser from "../../../api/fetchuser";
import { setControls } from "../../../api/setModeAndThreshold";
import Swal from "sweetalert2";
import "./AreaCards.scss";

const AreaCards = () => {
  const { selectedProductUid, setSelectedProductUid } = useContext(ProductContext);
  const [products, setProducts] = useState([]);
  const [productDetails, setProductDetails] = useState(null);
  const [thresholds, setThresholds] = useState({});
  const [controlStates, setControlStates] = useState({});
  const [mode, setMode] = useState("manual");
  const [expanded, setExpanded] = useState(false);
  const userId = localStorage.getItem("userId");
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchInitial = async () => {
      const data = await fetchProducts();
      if (Array.isArray(data)) {
        setProducts(data);
        const saved = localStorage.getItem("selectedProductUid") || data[0]?.uid;
        setSelectedProductUid(saved);
        localStorage.setItem("selectedProductUid", saved);
      }
      await fetchUser(); // optional
    };
    fetchInitial();
  }, [setSelectedProductUid]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!userId || !selectedProductUid) return;
      try {
        const url = import.meta.env.VITE_REACT_APP_API_URL;
        const res = await fetch(`${url}/api/v1/user/product/${userId}`);
        const data = await res.json();
        const selected = data.find((p) => p.uid === selectedProductUid);
        if (selected) {
          setProductDetails(selected);
          const initThresh = {};
          const initStates = {};
          selected.controls.forEach((c) => {
            initThresh[c.controlId] = c.threshHold || 0;
            initStates[c.controlId] = c.state || "OFF";
          });
          setThresholds(initThresh);
          setControlStates(initStates);
          const allAuto = selected.controls.every((c) => c.automate);
          setMode(allAuto ? "automate" : "manual");
        }
      } catch (err) {
        console.error("Error loading product:", err);
      }
    };
    fetchDetails();
  }, [selectedProductUid, userId]);

  const handleThresholdChange = (controlId, value) => {
    setThresholds((prev) => ({ ...prev, [controlId]: value }));
  };

  const handleSaveThreshold = async (controlId, pin) => {
    try {
      await setControls({
        uid: selectedProductUid,
        pin,
        value: thresholds[controlId],
        controlId,
        mode: "threshold",
      });
      Swal.fire("Saved!", "Threshold updated", "success");
    } catch {
      Swal.fire("Error", "Threshold update failed", "error");
    }
  };

  const handleTogglePower = async (controlId, pin, currentState) => {
    const newState = currentState === "ON" ? "off" : "on";
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      await fetch(`${url}/api/v1/command/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          uid: selectedProductUid,
          pin,
          value: newState,
          controlId,
        }),
      });
      setControlStates((prev) => ({
        ...prev,
        [controlId]: newState.toUpperCase(),
      }));
      Swal.fire("Success", `Control turned ${newState.toUpperCase()}`, "success");
    } catch {
      Swal.fire("Error", "Failed to toggle power", "error");
    }
  };

  const handleModeToggle = async () => {
    const newMode = mode === "manual" ? "automate" : "manual";
    setMode(newMode);
    try {
      await Promise.all(
        productDetails.controls.map((c) =>
          setControls({
            uid: selectedProductUid,
            pin: c.pin,
            value: newMode === "automate" ? "true" : "false",
            controlId: c.controlId,
            mode: "automate",
          })
        )
      );
      Swal.fire("Updated", `Mode switched to ${newMode}`, "success");
    } catch {
      Swal.fire("Error", "Failed to update mode", "error");
    }
  };

  const handleAutoCollapse = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setExpanded(false);
    }, 10000);
  };

  const controls = productDetails?.controls || [];

  return (
    <section className="content-area-cards">
      <div className="dropdown-container">
        <FormControl fullWidth variant="outlined" className="product-select-form">
          <InputLabel shrink>Select Product</InputLabel>
          <Select
            label="Select Product"
            value={selectedProductUid || ""}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedProductUid(val);
              localStorage.setItem("selectedProductUid", val);
            }}
            displayEmpty
          >
            {products.map((p) => (
              <MenuItem key={p._id} value={p.uid}>
                {p.alias}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <div className="area-cards-row">
        <motion.div className="area-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <PrecisionManufacturingIcon className="card-icon" />
          <div>
            <p className="info-title">Product</p>
            <p className="info-value">{productDetails?.alias || "—"}</p>
          </div>
        </motion.div>

        <motion.div className="area-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ElectricBoltIcon className="card-icon" />
          <div>
            <p className="info-title">Mode</p>
            <div className="mode-toggle">
              <Switch checked={mode === "automate"} onChange={handleModeToggle} />
              <span>{mode.toUpperCase()}</span>
            </div>
          </div>
        </motion.div>

        <motion.div className="area-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SettingsRemoteIcon className="card-icon" />
          <div>
            <p className="info-title">Controls</p>
            <p className="info-value">{controls.length}</p>
          </div>
        </motion.div>
      </div>

      <div className="control-panel">
        <Accordion
          expanded={expanded}
          onChange={() => setExpanded(!expanded)}
          onMouseEnter={() => clearTimeout(timerRef.current)}
          onMouseLeave={handleAutoCollapse}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#03856d" }}>
              🔧 Control Panel
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {controls.length === 0 ? (
              <Typography className="no-controls-msg">
                ⚠️ No controls available for this product.
              </Typography>
            ) : (
              <div className="controls-grid">
                {controls.map((control) => (
                  <div className="control-card" key={control.controlId}>
                    <h5>{control.name}</h5>
                    <div className="control-power-status">
                      <span>
                        ⚡ Power: <strong>{controlStates[control.controlId]}</strong>
                      </span>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          handleTogglePower(control.controlId, control.pin, controlStates[control.controlId])
                        }
                      >
                        TURN {controlStates[control.controlId] === "ON" ? "OFF" : "ON"}
                      </Button>
                    </div>
                    <Slider
                      value={thresholds[control.controlId] || 0}
                      min={control.min}
                      max={control.max}
                      step={0.1}
                      onChange={(_, val) => handleThresholdChange(control.controlId, val)}
                    />
                    <input
                      type="number"
                      value={thresholds[control.controlId] || 0}
                      onChange={(e) => handleThresholdChange(control.controlId, parseFloat(e.target.value))}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ mt: 1 }}
                      onClick={() => handleSaveThreshold(control.controlId, control.pin)}
                    >
                      Save Threshold
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </AccordionDetails>
        </Accordion>
      </div>
    </section>
  );
};

export default AreaCards;
  