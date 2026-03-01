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
  const [expanded, setExpanded] = useState(false);
  const [modeSwitchLoading, setModeSwitchLoading] = useState(false);
  const userId = localStorage.getItem("userId");
  const timerRef = useRef(null);

  const { publishCommandWithFeedback } = useMqttControl(selectedProductUid);

  // Safe response parser - handles HTML error pages that crash JSON.parse
  const parseApiResponse = async (response) => {
    const rawBody = await response.text();
    const contentType = response.headers.get("content-type") || "";

    if (!rawBody) return null;

    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(rawBody);
      } catch {
        return rawBody;
      }
    }

    try {
      return JSON.parse(rawBody);
    } catch {
      return rawBody;
    }
  };

  // Reusable function to fetch product details from backend
  const fetchDetails = useCallback(async () => {
    if (!userId || !selectedProductUid) return;
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(`${url}/api/v1/user/product/${userId}`);
      const data = await parseApiResponse(res);
      const selected = data.find((p) => p.uid === selectedProductUid);
      if (selected) {
        setProductDetails(selected);
        const initThresh = {};
        const initOffsets = {};
        const initStates = {};
        selected.controls.forEach((c) => {
          initThresh[c.controlId] = c.threshHold || 0;
          initOffsets[c.controlId] = c.offset || c.min || 0;
          initStates[c.controlId] = c.state || "OFF";
        });
        setThresholds(initThresh);
        setOffsets(initOffsets);
        setControlStates(initStates);
        console.log("✅ Product details refreshed from backend");
        console.log("📊 Product mode:", selected.mode);
        console.log("🎛️ Controls with supportsAuto:", selected.controls.map(c => ({ name: c.name, supportsAuto: c.supportsAuto, automate: c.automate })));
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
          uid: String(selectedProductUid),
          pin: String(pin),
          controlId: String(controlId),
          value: String(threshold),
          mode: "threshold"
        };

        console.log("📤 Sending threshold feedback to server:", feedbackPayload);

        const res = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/command/control/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feedbackPayload),
        });

        const result = await parseApiResponse(res);
        console.log("💾 Threshold saved to DB:", result);

        // Save offset separately
        const offsetPayload = {
          uid: String(selectedProductUid),
          pin: String(pin),
          controlId: String(controlId),
          value: String(offset),
          mode: "offset"
        };

        console.log("📤 Sending offset feedback to server:", offsetPayload);

        const offsetRes = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/command/control/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(offsetPayload),
        });

        const offsetResult = await parseApiResponse(offsetRes);
        console.log("💾 Offset saved to DB:", offsetResult);

        // Refetch to sync UI with backend
        await fetchDetails();

        window.dispatchEvent(
          new CustomEvent("thresholds-updated", { detail: { uid: selectedProductUid } })
        );

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
          uid: String(selectedProductUid),
          pin: String(pin),
          controlId: String(controlId),
          value: String(newState),  // "ON" or "OFF"
          mode: "state"
        };

        console.log("📤 Sending power toggle feedback to server:", feedbackPayload);

        const res = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/command/control/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feedbackPayload),
        });

        const result = await parseApiResponse(res);
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


  const handleModeToggle = async () => {
    if (!selectedProductUid || modeSwitchLoading) return;

    const newMode = productDetails.mode === "manual" ? "automate" : "manual";
    setModeSwitchLoading(true);

    Swal.fire({
      title: "Switching mode...",
      text: "Updating product configuration...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const response = await fetch(`${url}/api/v1/user/product/mode/${selectedProductUid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });

      const result = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(result?.message || result || `Failed to update mode (HTTP ${response.status})`);
      }

      console.log("✅ Global mode updated:", result);
      console.log("📋 Updated controls:", result.updatedControls);
      console.log("⏭️ Skipped controls (manual-only):", result.skippedControls);

      // Refetch product details to sync UI
      await fetchDetails();

      // Show success message with details
      const messageLines = [
        `Switched to ${newMode.toUpperCase()} mode`,
        `\n✅ Updated: ${result.updatedControls?.length || 0} controls`,
        result.skippedControls?.length > 0 ? `⏭️ Manual-only: ${result.skippedControls.length} controls` : ""
      ].filter(Boolean);

      Swal.fire("✅ Mode Updated", messageLines.join(""), "success");
    } catch (error) {
      console.error("❌ Mode toggle failed:", error);
      Swal.fire("❌ Failed", error.message || "Could not switch mode. Please try again.", "error");
      // Refetch to ensure UI matches backend state
      await fetchDetails();
    } finally {
      setModeSwitchLoading(false);
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
              <Tooltip title={!controls.length ? "Mode toggle disabled — no controls" : ""} arrow>
                <span>
                  <Switch
                    checked={productDetails?.mode === "automate"}
                    onChange={handleModeToggle}
                    disabled={!controls.length || modeSwitchLoading}
                  />
                </span>
              </Tooltip>
              <span>{productDetails?.mode?.toUpperCase() || "MANUAL"}</span>
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

        {/* <motion.div className="area-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#4caf50', animation: 'pulse 2s infinite' }} />
          </Box>
          <div>
            <p className="info-title">Device Status</p>
            <p className="info-value" style={{ fontSize: '12px' }}>Connected</p>
          </div>
        </motion.div> */}
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

                    {/* Power Button - In Manual Mode OR for Manual-Only Controls */}
                    {(productDetails?.mode === "manual" || (productDetails?.mode === "automate" && !control.supportsAuto)) && (
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

                    {/* Manual-Only Indicator */}
                    {productDetails?.mode === "manual" && !control.supportsAuto && (
                      <Box sx={{
                        p: 1.5,
                        bgcolor: '#fff3e0',
                        borderRadius: 1,
                        border: '1px solid #ffb74d',
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption" sx={{ color: '#e65100', fontWeight: 600 }}>
                          🪜 Manual Control Only
                        </Typography>
                      </Box>
                    )}

                    {/* Threshold Controls - Only in Automate Mode for Controls that Support Automation */}
                    {productDetails?.mode === "automate" && control.supportsAuto && (
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
                            value={thresholds[control.controlId] ?? 0}
                            onChange={(e) => {
                              const rawValue = e.target.value.trim();
                              if (rawValue === '') {
                                handleThresholdChange(control.controlId, '');
                              } else {
                                const parsed = parseInt(rawValue, 10);
                                if (!isNaN(parsed)) {
                                  handleThresholdChange(control.controlId, parsed);
                                }
                              }
                            }}
                            onBlur={(e) => {
                              const rawValue = e.target.value.trim();
                              if (rawValue === '') {
                                handleThresholdChange(control.controlId, 0);
                              } else {
                                const parsed = parseInt(rawValue, 10);
                                if (!isNaN(parsed)) {
                                  handleThresholdChange(control.controlId, parsed);
                                }
                              }
                            }}
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
                              Range: {control.min} - {control.max}
                            </Typography>
                          </Box>
                          <Slider
                            value={offsets[control.controlId] || control.min}
                            min={control.min}
                            max={control.max}
                            step={1}
                            valueLabelDisplay="auto"
                            onChange={(_, val) => handleOffsetChange(control.controlId, val)}
                            sx={{ mb: 1 }}
                          />
                          <TextField
                            type="number"
                            value={offsets[control.controlId] ?? control.min}
                            onChange={(e) => {
                              const rawValue = e.target.value.trim();
                              if (rawValue === '') {
                                handleOffsetChange(control.controlId, '');
                              } else {
                                const parsed = parseInt(rawValue, 10);
                                if (!isNaN(parsed)) {
                                  handleOffsetChange(control.controlId, parsed);
                                }
                              }
                            }}
                            onBlur={(e) => {
                              const rawValue = e.target.value.trim();
                              if (rawValue === '') {
                                handleOffsetChange(control.controlId, control.min);
                              } else {
                                const parsed = parseInt(rawValue, 10);
                                if (!isNaN(parsed)) {
                                  handleOffsetChange(control.controlId, parsed);
                                }
                              }
                            }}
                            size="small"
                            fullWidth
                            inputProps={{ min: control.min, max: control.max, step: 1 }}
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

                    {/* Manual-Only Notice in Automate Mode */}
                    {productDetails?.mode === "automate" && !control.supportsAuto && (
                      <Typography variant="caption" sx={{ color: '#d84315' }}>
                        This controller does not support automatic mode. Manual controls are shown above.
                      </Typography>
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
