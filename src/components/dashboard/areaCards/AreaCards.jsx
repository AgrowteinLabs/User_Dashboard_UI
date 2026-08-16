import { useEffect, useState, useContext, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Switch,
  Slider,
  Button,
  Tooltip,
  TextField,
  Divider
} from "@mui/material";
import SettingsRemoteIcon from "@mui/icons-material/SettingsRemote";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import { motion } from "framer-motion";
import { ProductContext } from "../../../context/ProductContext";
import fetchProducts from "../../../api/fetchProducts";
import fetchUser from "../../../api/fetchuser";
import Swal from "sweetalert2";
import { useMqttControl } from "../../../hooks/useMqttControl";
import ControlTimers from "../../controlTimers/ControlTimers";
import "./AreaCards.scss";

const AreaCards = ({ expanded, setExpanded }) => {
  const { products, selectedProductUid, setSelectedProductUid, selectedProduct, refetchProducts } = useContext(ProductContext);
  const productDetails = selectedProduct;
  const [thresholds, setThresholds] = useState({});
  const [offsets, setOffsets] = useState({});
  const [controlStates, setControlStates] = useState({});
  const [modeSwitchLoading, setModeSwitchLoading] = useState(false);
  const userId = localStorage.getItem("userId");

  // Tracks the last-saved threshold + offset per controlId so we can detect dirty state
  const originalConfigRef = useRef({});

  // Returns true if the user has changed threshold or offset for this control
  const isDirty = (controlId) => {
    const orig = originalConfigRef.current[controlId];
    if (!orig) return false;
    return (
      Number(thresholds[controlId]) !== Number(orig.threshold) ||
      Number(offsets[controlId]) !== Number(orig.offset)
    );
  };

  const { publishCommandWithFeedback } = useMqttControl(selectedProductUid);

  const collapseTimerRef = useRef(null);

  const startCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = setTimeout(() => {
      setExpanded(false);
    }, 10000); // Collapse automatically after 10 seconds of no interaction
  }, [setExpanded]);

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (expanded) {
      startCollapseTimer();
    } else {
      clearCollapseTimer();
    }
    return () => clearCollapseTimer();
  }, [expanded, startCollapseTimer, clearCollapseTimer]);

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

  // Populate control states when the selected product changes
  useEffect(() => {
    if (selectedProduct) {
      const initThresh = {};
      const initOffsets = {};
      const initStates = {};
      const initOriginals = {};
      selectedProduct.controls.forEach((c) => {
        const thresh = c.threshHold || 0;
        const offset = c.offset || c.min || 0;
        initThresh[c.controlId] = thresh;
        initOffsets[c.controlId] = offset;
        initStates[c.controlId] = c.state || "OFF";
        initOriginals[c.controlId] = { threshold: thresh, offset };
      });
      setThresholds(initThresh);
      setOffsets(initOffsets);
      setControlStates(initStates);
      originalConfigRef.current = initOriginals;
    }
  }, [selectedProduct]);

  useEffect(() => {
    fetchUser().catch(console.error);
  }, []);

  // Sync mode changes internally
  useEffect(() => {
    const handleRefresh = () => refetchProducts();
    window.addEventListener("thresholds-updated", handleRefresh);
    return () => window.removeEventListener("thresholds-updated", handleRefresh);
  }, [refetchProducts]);

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
        Swal.close();

        const feedbackPayload = {
          uid: String(selectedProductUid),
          pin: String(pin),
          controlId: String(controlId),
          value: String(threshold),
          mode: "threshold"
        };

        const res = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/command/control/save`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feedbackPayload),
        });
        await parseApiResponse(res);

        const offsetPayload = {
          uid: String(selectedProductUid),
          pin: String(pin),
          controlId: String(controlId),
          value: String(offset),
          mode: "offset"
        };

        const offsetRes = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/command/control/save`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(offsetPayload),
        });
        await parseApiResponse(offsetRes);

        await refetchProducts();

        // Update the saved baseline so the button goes back to disabled
        originalConfigRef.current[controlId] = { threshold, offset };

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
        Swal.close();

        const feedbackPayload = {
          uid: String(selectedProductUid),
          pin: String(pin),
          controlId: String(controlId),
          value: String(newState),
          mode: "state"
        };

        const res = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/command/control/save`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feedbackPayload),
        });
        await parseApiResponse(res);

        await refetchProducts();

        Swal.fire("✅ Success", `Control turned ${newState}`, "success");
      },
      () => {
        Swal.close();
        Swal.fire("❌ Timeout", "Device did not confirm", "error");
      }
    );
  };

  const updateGlobalModeInBackend = async (newMode) => {
    const baseUrl = import.meta.env.VITE_REACT_APP_API_URL;
    const endpointCandidates = [
      { url: `${baseUrl}/api/v1/user/product/mode/${selectedProductUid}`, method: "POST" },
      { url: `${baseUrl}/api/v1/user/product/mode/${selectedProductUid}`, method: "PUT" },
      { url: `${baseUrl}/api/v1/product/${selectedProductUid}/mode`, method: "POST" },
      { url: `${baseUrl}/api/v1/product/${selectedProductUid}/mode`, method: "PUT" },
    ];

    let lastError = null;
    for (const candidate of endpointCandidates) {
      try {
        const response = await fetch(candidate.url, {
          method: candidate.method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: newMode }),
        });
        const result = await parseApiResponse(response);
        if (response.ok) return result;
        const message = result?.message || result || `HTTP ${response.status}`;
        lastError = new Error(`${candidate.method} ${candidate.url} failed: ${message}`);
        if (response.status !== 404) throw lastError;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("Failed to update backend global mode");
  };

  const handleModeToggle = async () => {
    if (!selectedProductUid || modeSwitchLoading || !productDetails?.controls?.length) return;

    const newMode = productDetails.mode === "manual" ? "automate" : "manual";
    setModeSwitchLoading(true);

    Swal.fire({
      title: "Switching mode...",
      text: "Updating product configuration...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      await Promise.all(
        productDetails.controls.map(
          (control) =>
            new Promise((resolve, reject) => {
              const threshold = control.threshHold ?? 1;
              const offset = control.offset ?? control.min ?? 1;
              const supportsAuto = control.supportsAuto !== false;
              const shouldSendAuto = newMode === "automate" && supportsAuto;

              const modePayload =
                shouldSendAuto
                  ? {
                    command: "SetMode",
                    pin: control.pin,
                    mode: "Auto",
                    threshold,
                    offset: Math.max(1, offset),
                  }
                  : {
                    command: "SetMode",
                    pin: control.pin,
                    mode: "Manual",
                  };

              publishCommandWithFeedback(
                modePayload,
                () => resolve(),
                () => reject(new Error(`Device did not confirm mode command for ${control.name || control.pin}`))
              );
            })
        )
      );

      const result = await updateGlobalModeInBackend(newMode);
      await refetchProducts();

      const messageLines = [
        `Switched to ${newMode.toUpperCase()} mode`,
        `\n✅ Updated: ${result.updatedControls?.length || 0} controls`,
        result.skippedControls?.length > 0 ? `Manual-only: ${result.skippedControls.length} controls` : ""
      ].filter(Boolean);

      Swal.fire("✅ Mode Updated", messageLines.join(""), "success");
    } catch (error) {
      Swal.fire("❌ Failed", error.message || "Could not switch mode. Please try again.", "error");
      await refetchProducts();
    } finally {
      setModeSwitchLoading(false);
    }
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
          <div className="info-content">
            <p className="info-title">Product</p>
            <p className="info-value">{productDetails?.alias || "—"}</p>
          </div>
        </motion.div>

        <motion.div className="area-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ElectricBoltIcon className="card-icon" />
          <div className="info-content">
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
          <div className="info-content">
            <p className="info-title">Controls</p>
            <p className="info-value">{controls.length}</p>
          </div>
        </motion.div>
      </div>

      <div 
        className={`control-panel-flat ${!expanded ? "collapsed" : ""}`}
        onMouseEnter={clearCollapseTimer}
        onMouseMove={clearCollapseTimer}
        onMouseLeave={() => {
          if (expanded) startCollapseTimer();
        }}
      >
        <div 
          className="control-panel-header"
          onClick={() => setExpanded(!expanded)}
          style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="h6" className="panel-title">
            ⚙️ Controller Configuration
          </Typography>
          <span 
            className="toggle-icon-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--card-border)",
              cursor: "pointer"
            }}
          >
            <span style={{
              display: "block",
              transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              fontSize: "0.85rem",
              color: "var(--primary-emerald)",
              lineHeight: 1
            }}>
              ▼
            </span>
          </span>
        </div>
        {expanded && (
          <div className="control-panel-body">
            {controls.length === 0 ? (
              <div className="no-controls-msg">
                ⚠️ No controls available for this product.
              </div>
            ) : (
              <div className="controls-grid">
                {controls.map((control) => (
                  <div className="control-card" key={control.controlId}>
                    <div className="control-header-box">
                      <span className="control-title">
                        {control.name}
                      </span>
                    </div>

                    {/* Power Button - In Manual Mode OR for Manual-Only Controls */}
                    {(productDetails?.mode === "manual" || (productDetails?.mode === "automate" && !control.supportsAuto)) && (
                      <div className={`control-power-box ${controlStates[control.controlId] === "ON" ? 'state-on' : 'state-off'}`}>
                        <div className="state-info">
                          <span className="state-label">Status</span>
                          <span className="state-text">
                            {controlStates[control.controlId] || 'N/A'}
                          </span>
                        </div>
                        <Tooltip title={!controlStates[control.controlId] ? "No state data" : ""}>
                          <span>
                            <Button
                              onClick={() =>
                                handleTogglePower(control.controlId, control.pin, controlStates[control.controlId])
                              }
                              disabled={!controlStates[control.controlId]}
                              sx={{
                                minWidth: 110,
                                fontWeight: 800,
                                borderRadius: "10px",
                                fontFamily: "var(--font-family-jakarta)",
                                textTransform: "none",
                                fontSize: "0.82rem",
                                py: 0.7,
                                ...(controlStates[control.controlId] === "ON" ? {
                                  background: "var(--color-success) !important",
                                  backgroundColor: "var(--color-success) !important",
                                  color: "#050a15 !important",
                                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25) !important"
                                } : {
                                  border: "1px solid var(--card-border) !important",
                                  color: "var(--text-secondary) !important",
                                  background: "rgba(255, 255, 255, 0.02) !important",
                                  backgroundColor: "rgba(255, 255, 255, 0.02) !important",
                                  "&:hover": {
                                    borderColor: "var(--primary-emerald) !important",
                                    color: "var(--primary-emerald) !important",
                                    background: "rgba(0, 242, 155, 0.08) !important"
                                  }
                                })
                              }}
                            >
                              {controlStates[control.controlId] === "ON" ? "⚡ Turn OFF" : "🔌 Turn ON"}
                            </Button>
                          </span>
                        </Tooltip>
                      </div>
                    )}

                    {/* V2 Timer & Schedule — manual control context */}
                    {(productDetails?.mode === "manual" || (productDetails?.mode === "automate" && !control.supportsAuto)) && (
                      <ControlTimers
                        productId={productDetails?._id || productDetails?.id}
                        control={control}
                        onChanged={refetchProducts}
                        capabilities={productDetails?.capabilities}
                      />
                    )}

                    {/* Manual-Only Indicator */}
                    {productDetails?.mode === "manual" && !control.supportsAuto && (
                      <div className="manual-only-indicator">
                        🪜 Manual Control Only
                      </div>
                    )}

                    {/* Threshold Controls - Only in Automate Mode for Controls that Support Automation */}
                    {productDetails?.mode === "automate" && control.supportsAuto && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Threshold Section */}
                        <div className="threshold-slider-group">
                          <div className="slider-header">
                            <span className="slider-label">Threshold</span>
                            <span className="slider-range-text">Range: {control.min} - {control.max}</span>
                          </div>
                          <div className="slider-row">
                            <Slider
                              value={thresholds[control.controlId] || 0}
                              min={control.min}
                              max={control.max}
                              step={1}
                              valueLabelDisplay="auto"
                              onChange={(_, val) => handleThresholdChange(control.controlId, val)}
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
                              inputProps={{ min: control.min, max: control.max, step: 1 }}
                            />
                          </div>
                        </div>

                        {/* Offset Section */}
                        <div className="threshold-slider-group">
                          <div className="slider-header">
                            <span className="slider-label">Offset</span>
                            <span className="slider-range-text">Range: {control.min} - {control.max}</span>
                          </div>
                          <div className="slider-row">
                            <Slider
                              value={offsets[control.controlId] || control.min}
                              min={control.min}
                              max={control.max}
                              step={1}
                              valueLabelDisplay="auto"
                              onChange={(_, val) => handleOffsetChange(control.controlId, val)}
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
                              inputProps={{ min: control.min, max: control.max, step: 1 }}
                            />
                          </div>
                        </div>

                        <Divider />

                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          size="large"
                          disabled={!isDirty(control.controlId)}
                          onClick={() => handleSaveThreshold(control.controlId, control.pin)}
                          sx={{
                            py: 1.2,
                            fontWeight: 800,
                            borderRadius: "12px",
                            fontFamily: "var(--font-family-jakarta)",
                            textTransform: "none",
                            transition: "all 0.25s ease",
                            background: isDirty(control.controlId)
                              ? "linear-gradient(135deg, var(--primary-emerald) 0%, #00b880 100%) !important"
                              : "rgba(255,255,255,0.04) !important",
                            color: isDirty(control.controlId)
                              ? "#060b13 !important"
                              : "var(--text-muted) !important",
                            boxShadow: isDirty(control.controlId)
                              ? "0 4px 12px rgba(0, 242, 155, 0.15) !important"
                              : "none !important",
                            border: isDirty(control.controlId)
                              ? "none"
                              : "1px solid var(--card-border) !important",
                            "&:hover": isDirty(control.controlId) ? {
                              background: "linear-gradient(135deg, var(--secondary-teal) 0%, var(--primary-emerald) 100%) !important",
                              boxShadow: "0 6px 16px rgba(0, 242, 155, 0.25) !important"
                            } : {},
                            "body.light-mode &": {
                              color: isDirty(control.controlId) ? "white !important" : "var(--text-muted) !important"
                            }
                          }}
                        >
                          {isDirty(control.controlId) ? "Save Configuration" : "No Changes"}
                        </Button>
                      </div>
                    )}

                    {/* Manual-Only Notice in Automate Mode */}
                    {productDetails?.mode === "automate" && !control.supportsAuto && (
                      <Typography variant="caption" sx={{ color: 'var(--color-error)', fontWeight: 800, fontFamily: "var(--font-family-jakarta)" }}>
                        ⚠️ Manual controls only (automatic mode not supported).
                      </Typography>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

AreaCards.propTypes = {
  expanded: PropTypes.bool.isRequired,
  setExpanded: PropTypes.func.isRequired,
};

export default AreaCards;
