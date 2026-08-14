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
} from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";
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
          <DialogTitle>Configure Sensor: {selectedSensor.name.replace(/_/g, " ")}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="dense"
              label="Custom Name / Alias"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Zone 1 Temperature"
            />
            <FormControlLabel
              control={<Switch checked={visible} onChange={(e) => setVisible(e.target.checked)} />}
              label="Visible on Dashboard"
              sx={{ mt: 1, display: "block" }}
            />
            
            <div style={{ marginTop: "15px", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}>
              <FormControlLabel
                control={<Switch checked={threshEnabled} onChange={(e) => setThreshEnabled(e.target.checked)} />}
                label="Enable Threshold Alerts"
                sx={{ display: "block" }}
              />
              {threshEnabled && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <TextField
                      label="Min Value"
                      type="number"
                      size="small"
                      value={threshMin}
                      onChange={(e) => setThreshMin(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Max Value"
                      type="number"
                      size="small"
                      value={threshMax}
                      onChange={(e) => setThreshMax(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={threshAlert} onChange={(e) => setThreshAlert(e.target.checked)} />}
                      label="Trigger Push Alerts"
                    />
                  </Grid>
                </Grid>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedSensor(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveSensorSettings} sx={{ backgroundColor: "#03856d" }}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export default AreaTable;
