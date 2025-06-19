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
  Tooltip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsRemoteIcon from "@mui/icons-material/SettingsRemote";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import { motion } from "framer-motion";
import { ProductContext } from "../../../context/ProductContext";
import fetchProducts from "../../../api/fetchProducts";
import fetchUser from "../../../api/fetchuser";
import Swal from "sweetalert2";
import { useMqttControl } from "../../../hooks/useMqttControl";
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

  const { publishCommandWithFeedback } = useMqttControl(selectedProductUid);

  useEffect(() => {
    const fetchInitial = async () => {
      const data = await fetchProducts();
      if (Array.isArray(data)) {
        setProducts(data);
        const saved = localStorage.getItem("selectedProductUid") || data[0]?.uid;
        setSelectedProductUid(saved);
        localStorage.setItem("selectedProductUid", saved);
      }
      await fetchUser();
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

  const handleSaveThreshold = (controlId, pin) => {
  const threshold = thresholds[controlId];
  const payload = { command: "threshold", pin, threshold };

  Swal.fire({ title: "Sending...", text: "Waiting for ESP32 feedback", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  publishCommandWithFeedback(
    payload,
    async () => {
      console.log("📥 ESP32 confirmed threshold set:", payload);

      Swal.close(); // ✅ FIX

      const feedbackPayload = {
        uid: selectedProductUid,
        pin,
        controlId,
        value: threshold,
        mode: "threshold"
      };

      console.log("📤 Sending threshold feedback to server:", feedbackPayload);

      const res = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/command/control/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackPayload),
      });

      const result = await res.json();
      console.log("💾 Threshold saved to DB:", result);

      Swal.fire("✅ Success", "Threshold confirmed by ESP32", "success");
    },
    () => {
      Swal.close();
      Swal.fire("❌ Timeout", "ESP32 did not respond", "error");
    }
  );
};


  const handleTogglePower = (controlId, pin, currentState) => {
  const newState = currentState === "ON" ? "off" : "on";
  const payload = { command: "Manual", pin, threshold: thresholds[controlId] };

  Swal.fire({ title: "Sending...", text: "Waiting for ESP32 feedback", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  publishCommandWithFeedback(
    payload,
    async () => {
      console.log("📥 ESP32 confirmed power toggle:", payload);

      Swal.close(); // ✅ FIX

      const feedbackPayload = {
        uid: selectedProductUid,
        pin,
        controlId,
        value: newState.toUpperCase(),  // ✅ must be ON or OFF
        mode: "state"                   // ✅ should be 'state' for ON/OFF
      };

      console.log("📤 Sending power toggle feedback to server:", feedbackPayload);

      const res = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/command/control/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackPayload),
      });

      const result = await res.json();
      console.log("💾 Power state saved to DB:", result);

      setControlStates((prev) => ({ ...prev, [controlId]: newState.toUpperCase() }));
      Swal.fire("✅ Success", `Control turned ${newState.toUpperCase()}`, "success");
    },
    () => {
      Swal.close();
      Swal.fire("❌ Timeout", "ESP32 did not confirm", "error");
    }
  );
};


  const handleModeToggle = () => {
  const newMode = mode === "manual" ? "automate" : "manual";
  setMode(newMode);

  Swal.fire({ title: "Switching mode...", text: "Waiting for ESP32...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  Promise.all(
    productDetails.controls.map((c) =>
      new Promise((resolve, reject) => {
        const payload = {
          command: newMode === "automate" ? "Auto" : "Manual",
          pin: c.pin,
          threshold: thresholds[c.controlId],
        };

        publishCommandWithFeedback(
          payload,
          async () => {
            console.log("📥 ESP32 confirmed mode toggle:", payload);

            Swal.close();

            const feedbackPayload = {
              uid: selectedProductUid,
              pin: c.pin,
              controlId: c.controlId,
              value: newMode === "automate" ? "true" : "false",
              mode: "automate"
            };

            console.log("📤 Sending automate mode feedback:", feedbackPayload);

            const res = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/command/control/save`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(feedbackPayload),
            });

            const result = await res.json();
            console.log("💾 Mode state saved to DB:", result);

            resolve();
          },
          () => {
            Swal.close();
            reject(new Error(`ESP32 did not respond for pin ${c.pin}`));
          }
        );
      })
    )
  )
    .then(() => Swal.fire("✅ Mode Updated", `Switched to ${newMode.toUpperCase()}`, "success"))
    .catch((err) => Swal.fire("❌ Failed", err.message, "error"));
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
              <Tooltip title={!controls.length ? "Mode toggle disabled — no controls" : ""} arrow>
                <span>
                  <Switch checked={mode === "automate"} onChange={handleModeToggle} disabled={!controls.length} />
                </span>
              </Tooltip>
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
                    <Tooltip title={controlStates[control.controlId] ? "" : "No state data"}>
  <span>
    <Button
      variant="outlined"
      size="small"
      onClick={() =>
        handleTogglePower(control.controlId, control.pin, controlStates[control.controlId])
      }
      disabled={!controlStates[control.controlId]}
    >
      TURN {controlStates[control.controlId] === "ON" ? "OFF" : "ON"}
    </Button>
  </span>
</Tooltip>

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
