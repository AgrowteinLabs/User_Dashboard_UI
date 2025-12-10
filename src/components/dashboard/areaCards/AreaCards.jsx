import { useEffect, useState, useContext, useRef, useCallback } from "react";
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
  Tooltip,
  TextField,
  Box,
  Divider
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
  const [offsets, setOffsets] = useState({});
  const [controlStates, setControlStates] = useState({});
  const [mode, setMode] = useState("manual");
  const [expanded, setExpanded] = useState(false);
  const userId = localStorage.getItem("userId");
  const timerRef = useRef(null);

  const { publishCommandWithFeedback } = useMqttControl(selectedProductUid);

  // Reusable function to fetch product details from backend
  const fetchDetails = useCallback(async () => {
    if (!userId || !selectedProductUid) return;
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(`${url}/api/v1/user/product/${userId}`);
      const data = await res.json();
      const selected = data.find((p) => p.uid === selectedProductUid);
      if (selected) {
        setProductDetails(selected);
        const initThresh = {};
        const initOffsets = {};
        const initStates = {};
        selected.controls.forEach((c) => {
          initThresh[c.controlId] = c.threshHold || 0;
          initOffsets[c.controlId] = Math.max(1, c.offset || 1);
          initStates[c.controlId] = c.state || "OFF";
        });
        setThresholds(initThresh);
        setOffsets(initOffsets);
        setControlStates(initStates);
        const allAuto = selected.controls.every((c) => c.automate);
        setMode(allAuto ? "automate" : "manual");
        console.log("✅ Product details refreshed from backend");
      }
    } catch (err) {
      console.error("Error loading product:", err);
    }
  }, [userId, selectedProductUid]);

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
    fetchDetails();
  }, [selectedProductUid, userId, fetchDetails]);

  const handleThresholdChange = (controlId, value) => {
    setThresholds((prev) => ({ ...prev, [controlId]: value }));
  };

  const handleOffsetChange = (controlId, value) => {
    setOffsets((prev) => ({ ...prev, [controlId]: value }));
  };

  const handleSaveThreshold = (controlId, pin) => {
    const threshold = thresholds[controlId];
    const offset = offsets[controlId];
    const payload = { command: "SetThreshold", pin, threshold, offset };

    Swal.fire({ title: "Sending...", text: "Waiting for Device feedback", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    publishCommandWithFeedback(
      payload,
      async () => {
        console.log("📥 Device confirmed threshold set:", payload);

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

        // Save offset separately
        const offsetPayload = {
          uid: selectedProductUid,
          pin,
          controlId,
          value: offset,
          mode: "offset"
        };

        console.log("📤 Sending offset feedback to server:", offsetPayload);

        const offsetRes = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/command/control/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(offsetPayload),
        });

        const offsetResult = await offsetRes.json();
        console.log("💾 Offset saved to DB:", offsetResult);

        // Refetch to sync UI with backend
        await fetchDetails();

        Swal.fire("✅ Success", "Configuration saved successfully", "success");
      },
      () => {
        Swal.close();
        Swal.fire("❌ Timeout", "Device did not respond", "error");
      }
    );
  };


  const handleTogglePower = (controlId, pin, currentState) => {
    const newState = currentState === "ON" ? "OFF" : "ON";
    const payload = { command: "SetPower", pin, state: newState };

    Swal.fire({ title: "Sending...", text: "Waiting for Device feedback", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    publishCommandWithFeedback(
      payload,
      async () => {
        console.log("📥 Device confirmed power toggle:", payload);

        Swal.close(); // ✅ FIX

        const feedbackPayload = {
          uid: selectedProductUid,
          pin,
          controlId,
          value: newState,  // "ON" or "OFF"
          mode: "state"
        };

        console.log("📤 Sending power toggle feedback to server:", feedbackPayload);

        const res = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/command/control/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feedbackPayload),
        });

        const result = await res.json();
        console.log("💾 Power state saved to DB:", result);

        // Refetch to sync UI with backend
        await fetchDetails();

        Swal.fire("✅ Success", `Control turned ${newState}`, "success");
      },
      () => {
        Swal.close();
        Swal.fire("❌ Timeout", "Device did not confirm", "error");
      }
    );
  };


  const handleModeToggle = () => {
    const newMode = mode === "manual" ? "automate" : "manual";

    Swal.fire({ title: "Switching mode...", text: "Waiting for Device...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    Promise.all(
      productDetails.controls.map((c) =>
        new Promise((resolve, reject) => {
          const payload = {
            command: "SetMode",
            pin: c.pin,
            mode: newMode === "automate" ? "Auto" : "Manual",
            ...(newMode === "automate" && {
              threshold: thresholds[c.controlId] || 1,
              offset: Math.max(1, offsets[c.controlId] || 1)
            })
          };

          publishCommandWithFeedback(
            payload,
            async () => {
              console.log("📥 Device confirmed mode toggle:", payload);

              const feedbackPayload = {
                uid: selectedProductUid,
                pin: c.pin,
                controlId: c.controlId,
                value: newMode === "automate" ? "true" : "false",
                mode: "automate"
              };

              console.log("📤 Sending automate mode feedback:", feedbackPayload);
              console.log("📤 Full payload details:", {
                uid: feedbackPayload.uid,
                pin: feedbackPayload.pin,
                controlId: feedbackPayload.controlId,
                value: feedbackPayload.value,
                valueType: typeof feedbackPayload.value,
                mode: feedbackPayload.mode
              });

              try {
                const res = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/command/control/save`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(feedbackPayload),
                });

                const responseText = await res.text();
                console.log("📥 Backend response status:", res.status);
                console.log("📥 Backend response body:", responseText);

                if (!res.ok) {
                  console.error("❌ Backend error response:", responseText);
                  throw new Error(`Server error: ${res.status} - ${responseText}`);
                }

                const result = JSON.parse(responseText);
                console.log("💾 Mode state saved to DB:", result);
                resolve();
              } catch (error) {
                console.error("❌ Failed to save to DB:", error);
                reject(new Error(`Failed to save mode for ${c.name}: ${error.message}`));
              }
            },
            () => {
              reject(new Error(`Device did not respond for ${c.name}`));
            }
          );
        })
      )
    )
      .then(async () => {
        Swal.close();
        // Refetch to sync UI with backend
        await fetchDetails();
        Swal.fire("✅ Mode Updated", `Switched to ${newMode.toUpperCase()}`, "success");
      })
      .catch((err) => {
        Swal.close();
        // Revert to original mode if failed
        fetchDetails();
        Swal.fire("❌ Failed", err.message, "error");
      });
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
                    <Box sx={{ mb: 2, pb: 1.5, borderBottom: '2px solid #e0e0e0' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#03856d' }}>
                        {control.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {/* Pin: {control.pin} • ID: {control.controlId} */}
                      </Typography>
                    </Box>

                    {/* Power Button - Only in Manual Mode */}
                    {mode === "manual" && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          bgcolor: controlStates[control.controlId] === "ON" ? '#e8f5e9' : '#fafafa',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: controlStates[control.controlId] === "ON" ? '#4caf50' : '#e0e0e0'
                        }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Status
                            </Typography>
                            <Typography variant="h6" sx={{
                              color: controlStates[control.controlId] === "ON" ? '#4caf50' : '#9e9e9e',
                              fontWeight: 600
                            }}>
                              {controlStates[control.controlId] || 'N/A'}
                            </Typography>
                          </Box>
                          <Tooltip title={!controlStates[control.controlId] ? "No state data" : ""}>
                            <span>
                              <Button
                                variant={controlStates[control.controlId] === "ON" ? "contained" : "outlined"}
                                color={controlStates[control.controlId] === "ON" ? "error" : "success"}
                                onClick={() =>
                                  handleTogglePower(control.controlId, control.pin, controlStates[control.controlId])
                                }
                                disabled={!controlStates[control.controlId]}
                                sx={{ minWidth: 100 }}
                              >
                                TURN {controlStates[control.controlId] === "ON" ? "OFF" : "ON"}
                              </Button>
                            </span>
                          </Tooltip>
                        </Box>
                      </Box>
                    )}

                    {/* Threshold Controls - Only in Automate Mode */}
                    {mode === "automate" && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {/* Threshold Section */}
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#03856d' }}>
                              Threshold
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Range: {control.min} - {control.max}
                            </Typography>
                          </Box>
                          <Slider
                            value={thresholds[control.controlId] || 0}
                            min={control.min}
                            max={control.max}
                            step={1}
                            valueLabelDisplay="auto"
                            onChange={(_, val) => handleThresholdChange(control.controlId, val)}
                            sx={{ mb: 1 }}
                          />
                          <TextField
                            type="number"
                            value={thresholds[control.controlId] || 0}
                            onChange={(e) => handleThresholdChange(control.controlId, parseInt(e.target.value) || 0)}
                            size="small"
                            fullWidth
                            inputProps={{ min: control.min, max: control.max, step: 1 }}
                          />
                        </Box>

                        {/* Offset Section */}
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#03856d' }}>
                              Offset
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Range: 1 - 100
                            </Typography>
                          </Box>
                          <Slider
                            value={offsets[control.controlId] || 1}
                            min={1}
                            max={100}
                            step={1}
                            valueLabelDisplay="auto"
                            onChange={(_, val) => handleOffsetChange(control.controlId, val)}
                            sx={{ mb: 1 }}
                          />
                          <TextField
                            type="number"
                            value={offsets[control.controlId] || 1}
                            onChange={(e) => handleOffsetChange(control.controlId, Math.max(1, parseInt(e.target.value) || 1))}
                            size="small"
                            fullWidth
                            inputProps={{ min: 1, max: 100, step: 1 }}
                          />
                        </Box>

                        <Divider />

                        <Button
                          variant="contained"
                          fullWidth
                          size="large"
                          onClick={() => handleSaveThreshold(control.controlId, control.pin)}
                          sx={{
                            bgcolor: '#03856d',
                            '&:hover': { bgcolor: '#026d55' },
                            py: 1.2,
                            fontWeight: 600
                          }}
                        >
                          Save Configuration
                        </Button>
                      </Box>
                    )}
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
