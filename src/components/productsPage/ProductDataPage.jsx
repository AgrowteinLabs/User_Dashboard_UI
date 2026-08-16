import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useSensorData } from "../../hooks/useSensorData";
import { useMqttSensorData } from "../../hooks/useMqttSensorData";
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
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  History as HistoryIcon,
  ListAlt as ActivityIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Bolt as BoltIcon,
  PowerSettingsNew as PowerOnIcon,
  PowerOff as PowerOffIcon,
  WarningAmber as WarningIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { exportToExcel } from "../../utils/exportUtils";
import { getProductIcon } from "../../utils/productIcons";
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

// Maps activity log types to a visual tone + icon
const getActivityMeta = (type = "") => {
  const t = String(type).toLowerCase();
  if (
    /(turn\s*on|switch\s*on|power\s*on|\bon\b|enable|start|connected|online|resume)/.test(t)
  ) {
    return { cls: "success", icon: <PowerOnIcon /> };
  }
  if (
    /(turn\s*off|switch\s*off|power\s*off|\boff\b|disable|stop|disconnect|offline|error|fail|alarm)/.test(t)
  ) {
    return { cls: "error", icon: <PowerOffIcon /> };
  }
  if (/(threshold|alert|warn|exceed|high|low|critical)/.test(t)) {
    return { cls: "warning", icon: <WarningIcon /> };
  }
  if (/(sched|timer|time|recur)/.test(t)) {
    return { cls: "info", icon: <ScheduleIcon /> };
  }
  return { cls: "info", icon: <BoltIcon /> };
};

const ProductDataPage = () => {
  const { uid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const alias = location.state?.alias || uid;

  const { history } = useSensorData(uid);
  const { lastReceivedTime, connected } = useMqttSensorData(uid);
  const ProductIcon = getProductIcon(uid);

  // Live device status — online while fresh MQTT readings keep arriving
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(tick);
  }, []);

  const DEVICE_TIMEOUT_MS = 90_000;
  const isOnline = Boolean(lastReceivedTime) && now - lastReceivedTime < DEVICE_TIMEOUT_MS;
  const isConnecting = !isOnline && connected && !lastReceivedTime;
  const statusClass = isOnline ? "online" : isConnecting ? "connecting" : "offline";
  const statusLabel = isOnline ? "Live" : isConnecting ? "Connecting…" : "Offline";

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

  const formatDay = (dateStr) => dayjs(dateStr).format("MMM D, YYYY");

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

  const resetFilters = () => {
    setStartDate(dayjs().subtract(1, "day").format("YYYY-MM-DD"));
    setEndDate(dayjs().format("YYYY-MM-DD"));
    setFilteredHistory({});
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
            disableGutters
            className="sensor-container"
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} className="sensor-summary">
              <Typography className="sensor-title">{config.label}</Typography>
            </AccordionSummary>
            <AccordionDetails className="sensor-details">
              {historyData.length > 0 ? (
                <>
                  <div className="chart-date-range">
                    <span className="range-item">
                      <CalendarIcon className="range-icon" />
                      {formatDay(startDate)}
                      {startDate !== endDate ? ` – ${formatDay(endDate)}` : ""}
                    </span>
                    <span className="range-dot">•</span>
                    <span className="range-item">
                      <ScheduleIcon className="range-icon" />
                      Every {interval} min
                    </span>
                  </div>
                  <AreaChartCard
                    title={`${config.label} History`}
                    data={values}
                    labels={labels}
                    unit={config.unit}
                    badgeType="history"
                  />
                </>
              ) : (
                <div className="chart-empty">No history data for {sensorKey}</div>
              )}
            </AccordionDetails>
          </Accordion>
        );
      });

  return (
    <div className="product-data-page">
      {/* ─── Page Header ─────────────────────────────────── */}
      <div className="pdp-header">
        <button
          className="pdp-back"
          onClick={() => navigate("/products")}
          aria-label="Back to products"
        >
          <ArrowBackIcon />
        </button>
        <div className="pdp-avatar"><ProductIcon /></div>
        <div className="pdp-title-block">
          <h2>{alias}</h2>
          <div className="pdp-meta">
            <span className="pdp-uid">UID · {uid}</span>
            <span className={`pdp-status ${statusClass}`}>
              <span className="pdp-status-dot" />
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ─── View Toggle ─────────────────────────────────── */}
      <ToggleButtonGroup
        className="view-toggle"
        value={viewMode}
        exclusive
        onChange={(_, newMode) => newMode && setViewMode(newMode)}
      >
        <ToggleButton value="history">
          <HistoryIcon /> History
        </ToggleButton>
        <ToggleButton value="activity">
          <ActivityIcon /> Activity Log
        </ToggleButton>
      </ToggleButtonGroup>

      {/* ─── History: Filter Bar ─────────────────────────── */}
      {viewMode === "history" && (
        <div className="filter-controls">
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Select value={interval} onChange={(e) => setInterval(e.target.value)}>
            <MenuItem value={30}>30 Minutes</MenuItem>
            <MenuItem value={60}>1 Hour</MenuItem>
          </Select>
          <Button variant="contained" className="filter-apply" onClick={handleFilterData}>
            Apply Filter
          </Button>
          <Button variant="outlined" className="filter-reset" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      )}

      {/* ─── Activity Log ────────────────────────────────── */}
      {viewMode === "activity" && (
        <div className="activity-panel">
          <div className="activity-panel-header">
            <div>
              <h3>Device Activity Timeline</h3>
              <p>Latest events recorded for this device</p>
            </div>
            <Button
              className="activity-refresh"
              startIcon={<RefreshIcon />}
              onClick={fetchActivityLogs}
              disabled={activitiesLoading}
            >
              Refresh
            </Button>
          </div>

          {activitiesLoading ? (
            <div className="loading-spinner">
              <CircularProgress sx={{ color: "var(--primary-color)" }} />
            </div>
          ) : activities.length === 0 ? (
            <div className="activity-empty">
              <span className="empty-icon">🕘</span>
              <p>No activities logged for this device.</p>
            </div>
          ) : (
            <div className="activity-list">
              {activities.map((act) => {
                const meta = getActivityMeta(act.type);
                return (
                  <div className="activity-item" key={act.id || act._id}>
                    <div className={`activity-icon ${meta.cls}`}>{meta.icon}</div>
                    <div className="activity-body">
                      <p className="activity-desc">{act.description}</p>
                      <span className="activity-type">{act.type}</span>
                    </div>
                    <span className="activity-time">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── History: Charts ─────────────────────────────── */}
      {viewMode !== "activity" &&
        (loading ? (
          <div className="loading-spinner">
            <CircularProgress sx={{ color: "var(--primary-color)" }} />
          </div>
        ) : (
          <div className="charts-container">{renderCharts()}</div>
        ))}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </div>
  );
};

export default ProductDataPage;
