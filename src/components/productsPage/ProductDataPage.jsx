import { useParams, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useMqttSensorData } from "../../hooks/useMqttSensorData";
import { useSensorData } from "../../hooks/useSensorData";
import { fetchSensorList } from "../../api/fetchsensorlist";
import { fetchIntervalData } from "../../api/fetchHistoryData";
import BarChartCard from "../predefinedcharts/BarChartCard";
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

const isStale = (timestamp) => Date.now() - timestamp > 60 * 1000;

const ProductDataPage = () => {
  const theme = useTheme();
  const { uid } = useParams();
  const location = useLocation();
  const alias = location.state?.alias || uid;

  const { message: mqttMessage } = useMqttSensorData(uid);
  const { current, history } = useSensorData(uid);

  const [availableSensors, setAvailableSensors] = useState([]);
  const [viewMode, setViewMode] = useState("current");
  const [startDate, setStartDate] = useState(dayjs().subtract(1, "day").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [filteredHistory, setFilteredHistory] = useState({});
  const [interval, setInterval] = useState(60);
  const [loading, setLoading] = useState(false);

  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    const fetchSensors = async () => {
      const sensors = await fetchSensorList(uid);
      setAvailableSensors(sensors.map((s) => s.name.toLowerCase()));
    };
    fetchSensors();
  }, [uid]);

  const finalCurrent = useMemo(() => {
    if (mqttMessage && Object.keys(mqttMessage).length > 0) {
      return {
        data: Object.fromEntries(
          Object.entries(mqttMessage).map(([k, v]) => [
            k,
            { status: typeof v === "string" && v.includes("-er") ? "error" : "ok", value: v, timestamp: Date.now() },
          ])
        ),
      };
    }
    return current || { data: {} };
  }, [mqttMessage, current]);

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

  const renderCharts = (dataSource) =>
    Object.entries(sensorChartMap)
      .filter(([key]) => availableSensors.includes(key.toLowerCase()))
      .map(([sensorKey, config]) => {
        const sensorInfo = dataSource?.data?.[sensorKey];
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
              {viewMode === "current" ? (
                sensorInfo && sensorInfo.status !== "error" ? (
                  <>
                    <BarChartCard
                      title={`${config.label} - Current`}
                      value={parseFloat(sensorInfo.value).toFixed(2)}
                      unit={config.unit}
                      status={isStale(sensorInfo.timestamp) ? "stale" : "active"}
                    />
                  </>
                ) : (
                  <Typography color="error" align="center">
                    Error or no data for {sensorKey}
                  </Typography>
                )
              ) : historyData.length > 0 ? (
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
        <ToggleButton value="current">Current</ToggleButton>
        <ToggleButton value="history">History</ToggleButton>
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

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", margin: "40px 0" }}>
          <CircularProgress />
        </div>
      ) : (
        <div className="charts-container">{renderCharts(finalCurrent)}</div>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
    </div>
  );
};

export default ProductDataPage;
