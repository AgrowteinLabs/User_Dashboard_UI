import { useContext, useEffect, useState, useCallback } from "react";
import {
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Grid,
  Box,
  Typography,
} from "@mui/material";
import { Settings as SettingsIcon, Close as CloseIcon } from "@mui/icons-material";
import { ProductContext } from "../../../context/ProductContext";
import { useMqttSensorData } from "../../../hooks/useMqttSensorData";
import { fetchSensorList } from "../../../api/fetchsensorlist";
import Swal from "sweetalert2";
import "./AreaTable.scss";

const TABLE_HEADS = ["Sensor Name", "Status", "Last Updated", "Actions"];
const STALE_THRESHOLD_MS = 60 * 1000; // 60 seconds

const AreaTable = () => {
  const { selectedProductUid } = useContext(ProductContext);
  const { message: mqttMessage, lastReceivedTime } = useMqttSensorData(selectedProductUid);

  const [availableSensors, setAvailableSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(Date.now());
  const [productId, setProductId] = useState(null);

  // Sensor Settings state
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [customName, setCustomName] = useState("");
  const [visible, setVisible] = useState(true);
  const [threshEnabled, setThreshEnabled] = useState(false);
  const [threshMin, setThreshMin] = useState(0);
  const [threshMax, setThreshMax] = useState(100);
  const [threshAlert, setThreshAlert] = useState(false);

  // Force re-evaluation of stale sensors every 10s
  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const loadSensors = useCallback(async () => {
    if (!selectedProductUid) return;
    setLoading(true);
    try {
      // Find productId corresponding to selectedProductUid
      const userId = localStorage.getItem("userId");
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const prodRes = await fetch(`${url}/api/v1/user/product/${userId}`, { credentials: "include" });
      if (prodRes.ok) {
        const products = await prodRes.json();
        const found = products.find((p) => p.uid === selectedProductUid);
        if (found) {
          setProductId(found.id || found._id);
        }
      }

      const sensors = await fetchSensorList(selectedProductUid);
      setAvailableSensors(sensors || []);
    } catch (err) {
      console.error("Failed to fetch sensor list", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProductUid]);

  // Fetch available sensors on mount or uid change
  useEffect(() => {
    loadSensors();
  }, [loadSensors]);

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "--";
    const diff = tick - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 5) return `${minutes} min ago`;
    return ">5 min ago";
  };

  const getStatus = (sensorName) => {
    const sensorValue = mqttMessage?.[sensorName];
    const timestamp = lastReceivedTime;

    if (!mqttMessage || sensorValue === undefined || sensorValue === null) return "inactive";
    if (typeof sensorValue === "string" && sensorValue.includes("-er")) return "error";
    if (!timestamp || tick - timestamp > STALE_THRESHOLD_MS) return "stale";
    return "active";
  };

  const handleOpenSettings = (sensor) => {
    setSelectedSensor(sensor);
    setCustomName(sensor.customName || "");
    setVisible(sensor.visible !== false);
    setThreshEnabled(!!sensor.thresholds?.enabled);
    setThreshMin(sensor.thresholds?.min || 0);
    setThreshMax(sensor.thresholds?.max || 100);
    setThreshAlert(!!sensor.thresholds?.alertEnabled);
  };

  const handleSaveSensorSettings = async () => {
    if (!productId || !selectedSensor) return;
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(`${url}/api/v1/products/${productId}/sensors/${selectedSensor.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customName: customName || null,
          visible,
          thresholds: {
            enabled: threshEnabled,
            min: Number(threshMin),
            max: Number(threshMax),
            alertEnabled: threshAlert,
          },
        }),
      });

      if (res.ok) {
        Swal.fire("Success", "Sensor settings saved successfully!", "success");
        setSelectedSensor(null);
        loadSensors(); // Reload to refresh customNames and visibility
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Failed to save sensor settings");
      }
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to update sensor settings", "error");
    }
  };

  // Only render visible sensors
  const visibleSensors = availableSensors.filter((s) => s.visible !== false);

  const sensorEntries = visibleSensors.map((sensor) => {
    const status = getStatus(sensor.name);
    const lastSeen = getTimeAgo(lastReceivedTime);
    return {
      id: sensor.id,
      name: sensor.name,
      displayName: sensor.customName || sensor.name.replace(/_/g, " "),
      status,
      lastSeen: status === "inactive" ? "--" : lastSeen,
      rawSensor: sensor,
    };
  });

  return (
    <div className="area-table">
      {loading ? (
        <div className="loading-spinner">
          <CircularProgress />
        </div>
      ) : visibleSensors.length === 0 ? (
        <div className="loading-spinner">
          <p>⚠️ No sensors found for this product.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              {TABLE_HEADS.map((head, index) => (
                <th key={index}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sensorEntries.map((sensor, index) => (
              <tr key={index}>
                <td>{sensor.displayName}</td>
                <td>
                  <div className="dt-status">
                    <span className={`dt-status-dot dot-${sensor.status}`}></span>
                    <span className={`dt-status-text ${sensor.status}`}>{sensor.status}</span>
                  </div>
                </td>
                <td>{sensor.lastSeen}</td>
                <td>
                  <IconButton size="small" onClick={() => handleOpenSettings(sensor.rawSensor)}>
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Sensor Settings Dialog */}
      {selectedSensor && (
        <Dialog open={!!selectedSensor} onClose={() => setSelectedSensor(null)} fullWidth maxWidth="sm">
          <DialogTitle className="sensor-dialog-title" style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--card-border)"
          }}>
            <Box style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <SettingsIcon style={{ color: "var(--primary-color)", fontSize: "1.3rem" }} />
              <span style={{ fontWeight: 800, fontFamily: "var(--font-family-outfit)", fontSize: "1.15rem" }}>
                Sensor Configuration
              </span>
            </Box>
            <IconButton onClick={() => setSelectedSensor(null)} size="small" style={{ color: "var(--text-secondary)" }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <Box className="sensor-info-banner" style={{
              background: "rgba(0, 242, 155, 0.04)",
              border: "1px dashed rgba(0, 242, 155, 0.2)",
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "0.82rem",
              color: "var(--text-color)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontFamily: "var(--font-family-jakarta)"
            }}>
              ℹ️ Rename your sensor, toggle dashboard visibility, or set threshold boundaries for alerts.
            </Box>
            
            {/* Identity & Visibility Group */}
            <Box style={{
              background: "rgba(255, 255, 255, 0.01)",
              border: "1px solid var(--card-border)",
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}>
              <Typography variant="subtitle2" style={{
                fontFamily: "var(--font-family-jakarta)",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                marginBottom: "4px"
              }}>
                🏷️ Display & Visibility
              </Typography>
              <TextField
                fullWidth
                size="small"
                label="Custom Name / Alias"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={selectedSensor.name.replace(/_/g, " ")}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    background: "rgba(0, 242, 155, 0.02)",
                    "& fieldset": { borderColor: "var(--card-border)" },
                    "&:hover fieldset": { borderColor: "rgba(0, 242, 155, 0.3)" },
                    "&.Mui-focused fieldset": { borderColor: "var(--primary-color)" }
                  }
                }}
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={visible} 
                    onChange={(e) => setVisible(e.target.checked)}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "var(--primary-emerald)",
                        "& + .MuiSwitch-track": { backgroundColor: "var(--primary-emerald)", opacity: 0.4 }
                      }
                    }}
                  />
                }
                label="Show sensor on Dashboard"
                sx={{ 
                  margin: 0,
                  "& .MuiFormControlLabel-label": {
                    fontFamily: "var(--font-family-jakarta)",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "var(--text-color)"
                  }
                }}
              />
            </Box>

            {/* Threshold Alerts Group */}
            <Box style={{
              background: "rgba(255, 255, 255, 0.01)",
              border: "1px solid var(--card-border)",
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}>
              <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle2" style={{
                  fontFamily: "var(--font-family-jakarta)",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                  margin: 0
                }}>
                  🚨 Threshold Alert Rules
                </Typography>
                <Switch 
                  checked={threshEnabled} 
                  onChange={(e) => setThreshEnabled(e.target.checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "var(--primary-emerald)",
                      "& + .MuiSwitch-track": { backgroundColor: "var(--primary-emerald)", opacity: 0.4 }
                    }
                  }}
                />
              </Box>

              {threshEnabled ? (
                <Box style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "4px" }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Min Boundary"
                        type="number"
                        size="small"
                        value={threshMin}
                        onChange={(e) => setThreshMin(e.target.value)}
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            background: "rgba(0, 242, 155, 0.02)",
                            "& fieldset": { borderColor: "var(--card-border)" },
                            "&:hover fieldset": { borderColor: "rgba(0, 242, 155, 0.3)" },
                            "&.Mui-focused fieldset": { borderColor: "var(--primary-color)" }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Max Boundary"
                        type="number"
                        size="small"
                        value={threshMax}
                        onChange={(e) => setThreshMax(e.target.value)}
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            background: "rgba(0, 242, 155, 0.02)",
                            "& fieldset": { borderColor: "var(--card-border)" },
                            "&:hover fieldset": { borderColor: "rgba(0, 242, 155, 0.3)" },
                            "&.Mui-focused fieldset": { borderColor: "var(--primary-color)" }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={threshAlert} 
                        onChange={(e) => setThreshAlert(e.target.checked)}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "var(--primary-emerald)",
                            "& + .MuiSwitch-track": { backgroundColor: "var(--primary-emerald)", opacity: 0.4 }
                          }
                        }}
                      />
                    }
                    label="Send push notifications when out-of-bounds"
                    sx={{ 
                      margin: 0,
                      "& .MuiFormControlLabel-label": {
                        fontFamily: "var(--font-family-jakarta)",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        color: "var(--text-color)"
                      }
                    }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" style={{
                  fontFamily: "var(--font-family-jakarta)",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  margin: 0,
                  fontStyle: "italic"
                }}>
                  Threshold alerts are currently disabled. Toggle the switch to define safe sensor boundaries.
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions style={{
            padding: "16px 24px 24px",
            borderTop: "1px solid var(--card-border)",
            display: "flex",
            gap: "12px"
          }}>
            <Button 
              onClick={() => setSelectedSensor(null)}
              style={{
                fontFamily: "var(--font-family-jakarta)",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "10px",
                color: "var(--text-secondary)",
                padding: "8px 16px"
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSaveSensorSettings} 
              style={{
                fontFamily: "var(--font-family-jakarta)",
                fontWeight: 800,
                textTransform: "none",
                borderRadius: "12px",
                background: "linear-gradient(135deg, var(--primary-emerald) 0%, #00b880 100%)",
                color: "#060b13",
                boxShadow: "0 4px 12px rgba(0, 242, 155, 0.15)",
                padding: "8px 24px"
              }}
            >
              Save Settings
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export default AreaTable;
