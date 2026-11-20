import { useState, useContext, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Button,
  Tooltip,
  Box,
  Divider,
} from "@mui/material";
import SettingsInputComponentIcon from "@mui/icons-material/SettingsInputComponent";
import Swal from "sweetalert2";
import { ProductContext } from "../../context/ProductContext";
import { useDeviceType } from "../../hooks/useDeviceType";
import {
  ALL_PINS,
  PIN_SENSOR_LABELS,
  DEVICE_LABELS,
  DEVICE_ICONS,
  DEVICE_BEHAVIORS,
  getDevicesForPin,
} from "../../constants/deviceTypes";
import "./DeviceSelection.scss";

/**
 * DeviceSelection — UI for assigning a device type to each pin on a farm controller.
 *
 * Renders a card for each pin (P1–P4) with a dropdown to select the device type.
 * Shows the sensor label, current assignment, and device behavior tooltip.
 *
 * Props:
 *   - expanded {boolean} — whether the panel is expanded (controls collapse animation)
 */
const DeviceSelection = ({ expanded }) => {
  const { selectedProduct } = useContext(ProductContext);
  const {
    deviceAssignments,
    setDevice,
    getValidDevices,
    loading,
    error,
  } = useDeviceType();

  // Local state for pending changes (before saving)
  const [pendingChanges, setPendingChanges] = useState({});
  const [saving, setSaving] = useState(false);

  const controls = selectedProduct?.controls || [];

  // Get the current device for a pin (pending or saved)
  const getCurrentDevice = (pin) => {
    if (pendingChanges[pin] !== undefined) return pendingChanges[pin];
    return deviceAssignments[pin] || null;
  };

  // Check if there are any unsaved changes
  const hasChanges = Object.keys(pendingChanges).some(
    (pin) => pendingChanges[pin] !== (deviceAssignments[pin] || null)
  );

  const handleDeviceChange = (pin, newDevice) => {
    setPendingChanges((prev) => ({
      ...prev,
      [pin]: newDevice || null,
    }));
  };

  const handleSave = useCallback(async () => {
    if (!hasChanges || saving) return;

    setSaving(true);
    Swal.fire({
      title: "Saving device configuration...",
      text: "Sending commands to device",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    let successCount = 0;
    let failCount = 0;

    for (const pin of ALL_PINS) {
      if (pendingChanges[pin] === undefined) continue;

      const newDevice = pendingChanges[pin];
      const currentDevice = deviceAssignments[pin] || null;

      // Skip if nothing actually changed
      if (newDevice === currentDevice) continue;

      try {
        const result = await setDevice(pin, newDevice);
        if (result) successCount++;
        else failCount++;
      } catch (err) {
        console.error(`Failed to set device for ${pin}:`, err);
        failCount++;
      }
    }

    setPendingChanges({});
    setSaving(false);

    if (failCount === 0 && successCount > 0) {
      Swal.fire(
        "✅ Saved",
        `Device configuration updated for ${successCount} pin(s)`,
        "success"
      );
    } else if (successCount > 0) {
      Swal.fire(
        "⚠️ Partial Success",
        `${successCount} pin(s) saved, ${failCount} failed`,
        "warning"
      );
    } else if (failCount > 0) {
      Swal.fire("❌ Failed", "Could not save device configuration", "error");
    } else {
      Swal.close();
    }
  }, [hasChanges, saving, pendingChanges, deviceAssignments, setDevice]);

  const handleCancel = () => {
    setPendingChanges({});
  };

  // Find the control for a pin (to show the control name)
  const findControl = (pin) =>
    controls.find(
      (c) => String(c.pin || "").trim().toUpperCase() === pin
    );

  return (
    <div className={`device-selection-panel ${expanded ? "expanded" : "collapsed"}`}>
      <div className="device-selection-header">
        <div className="header-left">
          <SettingsInputComponentIcon className="header-icon" />
          <Typography variant="h6" className="header-title">
            🔌 Device Selection
          </Typography>
        </div>
        {hasChanges && (
          <div className="header-actions">
            <Button
              size="small"
              onClick={handleCancel}
              disabled={saving}
              sx={{
                textTransform: "none",
                fontFamily: "var(--font-family-jakarta)",
                color: "var(--text-muted)",
                fontSize: "0.75rem",
              }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{
                textTransform: "none",
                fontFamily: "var(--font-family-jakarta)",
                fontWeight: 700,
                fontSize: "0.75rem",
                background: "linear-gradient(135deg, var(--primary-emerald) 0%, #00b880 100%)",
                color: "#060b13",
                borderRadius: "8px",
                px: 2,
              }}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="device-selection-error">
          ⚠️ {error}
        </div>
      )}

      <div className="device-selection-grid">
        {ALL_PINS.map((pin) => {
          const validDevices = getDevicesForPin(pin);
          const currentDevice = getCurrentDevice(pin);
          const sensorLabel = PIN_SENSOR_LABELS[pin] || pin;
          const control = findControl(pin);
          const isModified =
            pendingChanges[pin] !== undefined &&
            pendingChanges[pin] !== (deviceAssignments[pin] || null);

          return (
            <div
              key={pin}
              className={`device-card ${isModified ? "modified" : ""} ${currentDevice ? "assigned" : "unassigned"}`}
            >
              <div className="device-card-header">
                <span className="pin-badge">{pin}</span>
                <span className="sensor-label">{sensorLabel}</span>
                {control && (
                  <span className="control-name">{control.name}</span>
                )}
              </div>

              <FormControl fullWidth size="small" className="device-select">
                <InputLabel id={`device-select-${pin}-label`}>
                  Select Device
                </InputLabel>
                <Select
                  labelId={`device-select-${pin}-label`}
                  value={currentDevice || ""}
                  label="Select Device"
                  onChange={(e) => handleDeviceChange(pin, e.target.value)}
                  disabled={loading || saving}
                  renderValue={(val) => {
                    if (!val) return "— None —";
                    return `${DEVICE_ICONS[val] || "⚙️"} ${DEVICE_LABELS[val] || val}`;
                  }}
                  sx={{
                    fontFamily: "var(--font-family-jakarta)",
                    fontSize: "0.85rem",
                    borderRadius: "10px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: isModified
                        ? "var(--primary-emerald)"
                        : "var(--card-border)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--primary-emerald)",
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>— None —</em>
                  </MenuItem>
                  {validDevices.map((device) => (
                    <Tooltip
                      key={device}
                      title={DEVICE_BEHAVIORS[device] || ""}
                      placement="right"
                      arrow
                    >
                      <MenuItem
                        value={device}
                        sx={{ fontFamily: "var(--font-family-jakarta)" }}
                      >
                        <span style={{ marginRight: 8 }}>
                          {DEVICE_ICONS[device] || "⚙️"}
                        </span>
                        {DEVICE_LABELS[device] || device}
                      </MenuItem>
                    </Tooltip>
                  ))}
                </Select>
              </FormControl>

              {currentDevice && (
                <div className="device-behavior">
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-family-jakarta)",
                      fontSize: "0.7rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {DEVICE_BEHAVIORS[currentDevice] || ""}
                  </Typography>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!selectedProduct && (
        <div className="device-selection-empty">
          <Typography
            variant="body2"
            sx={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-family-jakarta)",
              textAlign: "center",
              py: 2,
            }}
          >
            Select a product to configure device types.
          </Typography>
        </div>
      )}
    </div>
  );
};

DeviceSelection.propTypes = {
  expanded: PropTypes.bool.isRequired,
};

export default DeviceSelection;
