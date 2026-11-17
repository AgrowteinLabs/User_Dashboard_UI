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
import fetchUser from "../../../api/fetchuser";
import Swal from "sweetalert2";
import { useMqttControl } from "../../../hooks/useMqttControl";
import ControlTimers from "../../controlTimers/ControlTimers";
import "./AreaCards.scss";

const AreaCards = ({ expanded, setExpanded }) => {
  const {
    products,
    selectedProductUid,
    setSelectedProductUid,
    selectedProduct,
    setSelectedProductDetails,
    refetchProducts,
  } = useContext(ProductContext);
  const productDetails = selectedProduct;
  const [thresholds, setThresholds] = useState({});
  const [offsets, setOffsets] = useState({});
  const [controlStates, setControlStates] = useState({});
  const [modeSwitchLoading, setModeSwitchLoading] = useState(false);

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
      setSelectedProductDetails?.(selectedProduct);
      const initThresh = {};
      const initOffsets = {};
      const initStates = {};
      const initOriginals = {};
      selectedProduct.controls.forEach((c) => {
        const thresh = c.threshHold !== undefined && c.threshHold !== null ? Number(c.threshHold) : 0;
        const off = c.offset !== undefined && c.offset !== null ? Number(c.offset) : (c.min ?? 0);
        initThresh[c.controlId] = isNaN(thresh) ? 0 : thresh;
        initOffsets[c.controlId] = isNaN(off) ? (c.min ?? 0) : off;
        initStates[c.controlId] = c.state || "OFF";
        initOriginals[c.controlId] = { threshold: initThresh[c.controlId], offset: initOffsets[c.controlId] };
      });
      setThresholds(initThresh);
      setOffsets(initOffsets);
      setControlStates(initStates);
      originalConfigRef.current = initOriginals;
    }
  }, [selectedProduct, setSelectedProductDetails]);

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
    const formatted = typeof value === "number" ? Math.round(value * 100) / 100 : value;
    setThresholds((prev) => ({ ...prev, [controlId]: formatted }));
  };

  const handleOffsetChange = (controlId, value) => {
    const formatted = typeof value === "number" ? Math.round(value * 100) / 100 : value;
    setOffsets((prev) => ({ ...prev, [controlId]: formatted }));
  };

  const handleSaveThreshold = (controlId, pin) => {
    const threshold = Number(thresholds[controlId]) || 0;
    const offset = Number(offsets[controlId]) || 0;
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

        setControlStates((prev) => ({ ...prev, [controlId]: newState }));

        window.dispatchEvent(
          new CustomEvent("thresholds-updated", { detail: { uid: selectedProductUid } })
        );

        Swal.fire("✅ Success", `Control turned ${newState}`, "success");
      },
      () => {
        Swal.close();
        Swal.fire("❌ Timeout", "Device did not respond", "error");
      }
    );
  };

  const updateGlobalModeInBackend = async (newMode) => {
    const baseUrl = import.meta.env.VITE_REACT_APP_API_URL;
    const candidates = [
      {
        url: `${baseUrl}/api/v1/products/${selectedProductUid}/mode`,
        method: "PUT",
      },
      {
        url: `${baseUrl}/api/v1/mode/${selectedProductUid}`,
        method: "PUT",
      },
      {
        url: `${baseUrl}/api/v1/products/${selectedProductUid}/mode`,
        method: "POST",
      },
      {
        url: `${baseUrl}/api/v1/mode/${selectedProductUid}`,
        method: "POST",
      },
    ];

    let lastError = null;
    for (const candidate of candidates) {
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
                    offset: Math.max(0, offset),
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
        result?.backendNotice ? `(${result.backendNotice})` : null,
      ].filter(Boolean);

      Swal.fire({
        icon: "success",
        title: "Mode Updated",
        html: messageLines.join("<br/>"),
      });

      window.dispatchEvent(
        new CustomEvent("thresholds-updated", { detail: { uid: selectedProductUid } })
      );
    } catch (err) {
      console.error("Global mode switch error:", err);
      Swal.fire("⚠️ Partial Update", err.message || "Could not switch mode cleanly", "warning");
    } finally {
      setModeSwitchLoading(false);
    }
  };

  return (
    <section className={`area-cards ${expanded ? "expanded" : "collapsed"}`}>
      {/* ── Outer Shell ────────────────────────────────────────────── */}
      <div className="area-card-shell">
        {/* Dynamic Multi-Farm Selector */}
        <div className="product-selector-wrapper">
          <FormControl fullWidth variant="outlined" className="product-dropdown-form">
            <InputLabel id="farm-select-label" className="custom-dropdown-label">
              Active Monitoring Farm
            </InputLabel>
            <Select
              labelId="farm-select-label"
              id="farm-select"
              value={selectedProductUid || ""}
              onChange={(e) => {
                setSelectedProductUid(e.target.value);
              }}
              label="Active Monitoring Farm"
              className="product-select-custom"
            >
              {products.map((p) => {
                const displayName = p.customName || p.alias || p.name || p.uid;
                return (
                  <MenuItem key={p.uid} value={p.uid} className="product-menu-item">
                    <span className="item-name">{displayName}</span>
                    <span className="item-uid">{p.uid}</span>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </div>

        {/* Header Ribbon & Expand Toggle */}
        <div
          className="section-header-ribbon"
          onClick={() => {
            const next = !expanded;
            setExpanded(next);
            if (next) startCollapseTimer();
            else clearCollapseTimer();
          }}
        >
          <div className="header-left">
            <h3 className="section-title">
              <span className="title-icon">⚡</span> Device Control Center
            </h3>
            {productDetails && (
              <span className="farm-alias-badge">
                {productDetails.customName || productDetails.alias || productDetails.name || "Main Unit"}
              </span>
            )}
          </div>

          <div className="header-right">
            {/* Global Operation Mode Pill */}
            {productDetails && (
              <motion.div
                className={`global-mode-pill ${productDetails.mode === "automate" ? "automate" : "manual"}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleModeToggle();
                }}
              >
                <div className="mode-icon-circle">
                  {productDetails.mode === "automate" ? (
                    <PrecisionManufacturingIcon className="mode-icon spinning" />
                  ) : (
                    <SettingsRemoteIcon className="mode-icon" />
                  )}
                </div>
                <div className="mode-text-group">
                  <span className="mode-caption">Global Mode</span>
                  <span className="mode-value">
                    {productDetails.mode === "automate" ? "Automated" : "Manual"}
                  </span>
                </div>
                <div className="status-pulse-dot" />
              </motion.div>
            )}

            {/* Expansion Arrow Pill */}
            <div className={`accordion-trigger-pill ${expanded ? "open" : ""}`}>
              <span className="trigger-text">{expanded ? "Hide Controls" : "Configure"}</span>
              <span className="trigger-chevron">❯</span>
            </div>
          </div>
        </div>

        {/* Collapsible Accordion Drawer */}
        {expanded && (
          <div
            className="controls-drawer"
            onMouseEnter={clearCollapseTimer}
            onMouseLeave={startCollapseTimer}
          >
            {/* Control Timers Module */}
            <div className="control-timers-container">
              <ControlTimers
                product={productDetails}
                onTimersUpdated={() => refetchProducts()}
              />
            </div>

            <Divider className="drawer-divider" />

            {!productDetails?.controls?.length ? (
              <div className="empty-controls-banner">
                <span className="empty-icon">🔌</span>
                <p>No active relay controls configured for this unit.</p>
              </div>
            ) : (
              <div className="controls-grid">
                {productDetails.controls.map((control) => (
                  <div key={control.controlId} className="control-node-card">
                    {/* Control Card Header */}
                    <div className="control-node-header">
                      <div className="node-title-group">
                        <div className="node-icon-avatar">
                          <ElectricBoltIcon className="node-icon" />
                        </div>
                        <div>
                          <h4 className="node-name">{control.name || `Relay #${control.pin}`}</h4>
                          <span className="node-pin-tag">PIN {control.pin}</span>
                        </div>
                      </div>

                      {/* Power Switch Action */}
                      <Tooltip
                        title={
                          productDetails?.mode === "automate" && control.supportsAuto
                            ? "Power switches automatically based on thresholds"
                            : `Turn ${controlStates[control.controlId] === "ON" ? "OFF" : "ON"}`
                        }
                      >
                        <span>
                          <Switch
                            checked={controlStates[control.controlId] === "ON"}
                            disabled={productDetails?.mode === "automate" && control.supportsAuto}
                            onChange={() =>
                              handleTogglePower(
                                control.controlId,
                                control.pin,
                                controlStates[control.controlId]
                              )
                            }
                            className="power-toggle-switch"
                          />
                        </span>
                      </Tooltip>
                    </div>

                    {/* Manual Mode Status Notice */}
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
                              value={
                                thresholds[control.controlId] !== undefined && thresholds[control.controlId] !== ""
                                  ? Number(thresholds[control.controlId]) || 0
                                  : Number(control.min ?? 0)
                              }
                              min={Number(control.min ?? 0)}
                              max={Number(control.max ?? 100)}
                              step={0.1}
                              valueLabelDisplay="auto"
                              onChange={(_, val) => handleThresholdChange(control.controlId, val)}
                            />
                            <TextField
                              type="number"
                              value={thresholds[control.controlId] ?? 0}
                              onChange={(e) => {
                                const rawValue = e.target.value;
                                if (rawValue === '') {
                                  handleThresholdChange(control.controlId, '');
                                } else {
                                  const parsed = parseFloat(rawValue);
                                  if (!isNaN(parsed)) {
                                    handleThresholdChange(control.controlId, rawValue);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const rawValue = String(e.target.value).trim();
                                if (rawValue === '' || isNaN(Number(rawValue))) {
                                  handleThresholdChange(control.controlId, Number(control.min ?? 0));
                                } else {
                                  const parsed = parseFloat(rawValue);
                                  handleThresholdChange(control.controlId, parsed);
                                }
                              }}
                              size="small"
                              inputProps={{ min: control.min, max: control.max, step: 0.1 }}
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
                              value={
                                offsets[control.controlId] !== undefined && offsets[control.controlId] !== ""
                                  ? Number(offsets[control.controlId]) || 0
                                  : Number(control.min ?? 0)
                              }
                              min={Number(control.min ?? 0)}
                              max={Number(control.max ?? 100)}
                              step={0.1}
                              valueLabelDisplay="auto"
                              onChange={(_, val) => handleOffsetChange(control.controlId, val)}
                            />
                            <TextField
                              type="number"
                              value={offsets[control.controlId] ?? (control.min ?? 0)}
                              onChange={(e) => {
                                const rawValue = e.target.value;
                                if (rawValue === '') {
                                  handleOffsetChange(control.controlId, '');
                                } else {
                                  const parsed = parseFloat(rawValue);
                                  if (!isNaN(parsed)) {
                                    handleOffsetChange(control.controlId, rawValue);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const rawValue = String(e.target.value).trim();
                                if (rawValue === '' || isNaN(Number(rawValue))) {
                                  handleOffsetChange(control.controlId, Number(control.min ?? 0));
                                } else {
                                  const parsed = parseFloat(rawValue);
                                  handleOffsetChange(control.controlId, parsed);
                                }
                              }}
                              size="small"
                              inputProps={{ min: control.min, max: control.max, step: 0.1 }}
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
