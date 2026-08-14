import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useSensorData } from "../../hooks/useSensorData";
import { fetchSensorList } from "../../api/fetchsensorlist";
import { fetchIntervalData } from "../../api/fetchHistoryData";
import AreaChartCard from "../predefinedcharts/AreaChartCard";
import {
  ToggleButton,
  ToggleButtonGroup,
  Button,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTheme } from "@mui/material/styles";
import { exportToExcel } from "../../utils/exportUtils";
import dayjs from "dayjs";
import "./ProductDataPage.scss";

const sensorChartMap = {
  Temperature_1: { type: "bar", unit: "°C", label: "Temperature 1" },
  Temperature_2: { type: "bar", unit: "°C", label: "Temperature 2" },
  Temperature: { type: "bar", unit: "°C", label: "Temperature" },
  Humidity_1: { type: "bar", unit: "%", label: "Humidity 1" },
  Humidity_2: { type: "bar", unit: "%", label: "Humidity 2" },
  Humidity: { type: "bar", unit: "%", label: "Humidity" },
  pH: { type: "area", unit: "", label: "pH Level" },
  Water_Used: { type: "area", unit: "L", label: "Water Used" },
  Bed_Temperature: { type: "bar", unit: "°C", label: "Bed Temperature" },
  Boiler_Temperature: { type: "bar", unit: "°C", label: "Boiler Temperature" },
  Pressure: { type: "bar", unit: "Pa", label: "Pressure" },
  Flow_Rate: { type: "bar", unit: "L/min", label: "Flow Rate" },
  Turbidity: { type: "bar", unit: "NTU", label: "Turbidity" },
  TDS: { type: "bar", unit: "ppm", label: "Electric Conductivity" },
  "Electric Conductivity": { type: "bar", unit: "ppm", label: "Electric Conductivity" },
  "Dissolved Oxygen": { type: "bar", unit: "mg/L", label: "Dissolved Oxygen" },
  "CO2 Sensor 1": { type: "bar", unit: "ppm", label: "CO2 Sensor 1" },
  "CO2 Sensor 2": { type: "bar", unit: "ppm", label: "CO2 Sensor 2" },
  "CO2 Sensor 3": { type: "bar", unit: "ppm", label: "CO2 Sensor 3" },
  "CO2 Sensor 4": { type: "bar", unit: "ppm", label: "CO2 Sensor 4" },
  "CO2 Sensor": { type: "bar", unit: "ppm", label: "CO₂ Level" },
  CO2: { type: "bar", unit: "ppm", label: "CO₂ Level" },
};


const ProductDataPage = () => {
  const theme = useTheme();
  const { uid } = useParams();
  const location = useLocation();
  const alias = location.state?.alias || uid;

  const { history } = useSensorData(uid);

  const [availableSensors, setAvailableSensors] = useState([]);
  const [viewMode, setViewMode] = useState("history");
  const [startDate, setStartDate] = useState(dayjs().subtract(1, "day").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [filteredHistory, setFilteredHistory] = useState({});
  const [interval, setInterval] = useState(60);
  const [loading, setLoading] = useState(false);

  // Resolved ProductId and Activities states
  const [productId, setProductId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // Resolve ProductId from UID
  useEffect(() => {
    const resolveProductId = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const url = import.meta.env.VITE_REACT_APP_API_URL;
        const res = await fetch(`${url}/api/v1/user/product/${userId}`, { credentials: "include" });
        if (res.ok) {
          const products = await res.json();
          const found = products.find((p) => p.uid === uid);
          if (found) {
            setProductId(found.id || found._id);
          }
        }
      } catch (err) {
        console.error("Failed to resolve product ID:", err);
      }
    };
    resolveProductId();
  }, [uid]);

  // Fetch Activity logs when selected and productId resolved
  const fetchActivityLogs = useCallback(async () => {
    if (!productId) return;
    setActivitiesLoading(true);
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(`${url}/api/v1/products/${productId}/activity-log?limit=50`, {
        credentials: "include",
      });
      if (res.ok) {
        const result = await res.json();
        setActivities(result.data?.activities || []);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    } finally {
      setActivitiesLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (viewMode === "activity") {
      fetchActivityLogs();
    }
  }, [viewMode, fetchActivityLogs]);

  useEffect(() => {
    const fetchSensors = async () => {
      const sensors = await fetchSensorList(uid);
      setAvailableSensors(sensors.map((s) => s.name.toLowerCase()));
    };
    fetchSensors();
  }, [uid]);


  const handleFilterData = async () => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const dayDiff = end.diff(start, "day") + 1;

    if (dayDiff > 14) {
      showSnackbar("Selected range exceeds 14 days. Please contact admin.");
      setFilteredHistory({});
      return;
    }

    setLoading(true);
    showSnackbar("Fetching data, please wait...");
    const data = await fetchIntervalData(uid, startDate, endDate, interval);

    if (dayDiff > 7) {
      showSnackbar("Data exceeds 7 days. Exporting to file instead.");
      exportToExcel(data, `${uid}_${startDate}_to_${endDate}.xlsx`);
      setFilteredHistory({});
    } else {
      showSnackbar(`Displaying data from ${startDate} to ${endDate} in ${interval}-minute intervals.`);
      setFilteredHistory(structureDataBySensor(data));
    }
    setLoading(false);
  };

  const structureDataBySensor = (data) => {
    const result = {};
    data.forEach((entry) => {
      Object.entries(entry.data).forEach(([sensorKey, value]) => {
        if (!result[sensorKey]) result[sensorKey] = [];
        result[sensorKey].push({ timestamp: entry.timestamp, value });
      });
    });
    return result;
  };

  const renderCharts = () =>
    Object.entries(sensorChartMap)
      .filter(([key]) => availableSensors.includes(key.toLowerCase()))
      .map(([sensorKey, config]) => {
        const historyData = filteredHistory[sensorKey] || history[sensorKey] || [];
        const labels = historyData.map((e) => new Date(e.timestamp).toLocaleString());
        const values = historyData.map((e) => parseFloat(e.value).toFixed(2));

        return (
          <Accordion
            key={sensorKey}
            defaultExpanded
            sx={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[1],
              borderRadius: 1,
              mb: 2,
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
              <Typography fontWeight="700" sx={{ width: "100%", textAlign: "center", fontSize: "1.3rem", color: theme.palette.primary.main }}>
                {config.label}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {historyData.length > 0 ? (
                <>
                  <Typography variant="subtitle2" align="center" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                    Data from {startDate} to {endDate}
                  </Typography>
                  <AreaChartCard title={`${config.label} History`} data={values} labels={labels} unit={config.unit} />
                </>
              ) : (
                <Typography color="error" align="center">
                  No history data for {sensorKey}
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        );
      });

  return (
    <div className="product-data-page" style={{ color: theme.palette.text.primary }}>
      <h2 style={{ color: theme.palette.text.primary }}>Sensor Data - {alias}</h2>

      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_, newMode) => newMode && setViewMode(newMode)}
        color="primary"
        sx={{ display: "flex", justifyContent: "center", mb: 2 }}
      >
        <ToggleButton value="history">History</ToggleButton>
        <ToggleButton value="activity">Activity Log</ToggleButton>
      </ToggleButtonGroup>

      {viewMode === "history" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", backgroundColor: theme.palette.background.paper, padding: "12px 16px", borderRadius: "8px", marginBottom: "20px" }}>
          <TextField label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 180 }} />
          <TextField label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 180 }} />
          <Select value={interval} onChange={(e) => setInterval(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value={30}>30 Minutes</MenuItem>
            <MenuItem value={60}>1 Hour</MenuItem>
          </Select>
          <Button variant="contained" onClick={handleFilterData}>Apply Filter</Button>
          <Button variant="outlined" onClick={() => { setStartDate(dayjs().subtract(1, "day").format("YYYY-MM-DD")); setEndDate(dayjs().format("YYYY-MM-DD")); setFilteredHistory({}); }}>Reset</Button>
        </div>
      )}

      {viewMode === "activity" && (
        <div style={{ backgroundColor: theme.palette.background.paper, padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
          <Typography variant="h6" color="primary" sx={{ mb: 2 }}>Device Activity Timeline</Typography>
          {activitiesLoading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : activities.length === 0 ? (
            <Typography align="center" color="text.secondary">No activities logged for this device.</Typography>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {activities.map((act) => (
                <div key={act.id || act._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <div>
                    <Typography variant="body1" fontWeight={600}>{act.description}</Typography>
                    <Typography variant="caption" color="text.secondary">Type: {act.type}</Typography>
                  </div>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(act.timestamp).toLocaleString()}
                  </Typography>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode !== "activity" && (
        loading ? (
          <div style={{ display: "flex", justifyContent: "center", margin: "40px 0" }}>
            <CircularProgress />
          </div>
        ) : (
          <div className="charts-container">{renderCharts()}</div>
        )
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
    </div>
  );
};

export default ProductDataPage;
