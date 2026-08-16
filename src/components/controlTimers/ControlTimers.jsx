import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  IconButton,
  TextField,
  Typography,
  Box,
  Divider,
  Chip,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  TimerOutlined,
  Schedule as ScheduleIcon,
  Close,
  DeleteOutline,
  Add,
  PlayArrow,
  StopCircle,
  EventRepeat,
  Event,
  Today,
} from "@mui/icons-material";
import {
  fetchActiveTimer,
  startTimer,
  cancelTimer,
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../../api/controlTimers";
import PropTypes from "prop-types";
import "./ControlTimers.scss";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PRESETS_MIN = [5, 10, 15, 30, 60];

const pad = (n) => String(n).padStart(2, "0");

// "HH:MM:SS" or "Hh Mm Ss" for long runs
function formatRemaining(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${pad(m)}:${pad(s)}`;
  return `0:${pad(s)}`;
}

const describeSchedule = (s) => {
  const action = s.action === "ON" ? "Turn ON" : "Turn OFF";
  const startTime = s.startTime || s.time || "--:--";
  const rangeStr = s.endTime ? `from ${startTime} to ${s.endTime}` : `at ${startTime}`;
  if (s.scheduleType === "once") {
    const d = s.startDate ? new Date(s.startDate).toLocaleDateString() : "";
    return `${action} once on ${d} ${rangeStr}`;
  }
  if (s.scheduleType === "weekly") {
    const days = (s.days || []).length
      ? (s.days || [])
          .map((d) => DAY_LABELS[Number(d)])
          .filter(Boolean)
          .join(", ")
      : "every day";
    return `${action} ${days} ${rangeStr}`;
  }
  return `${action} daily ${rangeStr}`;
};

const ControlTimers = ({ productId, control, onChanged, capabilities }) => {
  const controlKey = control.controlId || control.pin;
  const defaultTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    []
  );

  // v1/v2 capabilities gating (handover §7): v2 products expose Timer+Schedule
  // in the Manual stage; v1 products are Manual+Automate only. Default TRUE
  // when the payload doesn't carry capabilities (no feature regression).
  // Escape hatch: whenever a timer/schedule ALREADY EXISTS its management UI
  // stays visible regardless of capabilities — legacy rows must never strand
  // an active timer or existing schedules.
  const canTimer = capabilities ? capabilities.timer !== false : true;
  const canSchedule = capabilities ? capabilities.schedule !== false : true;

  // --- Active timer + countdown ---
  const [timer, setTimer] = useState(null);
  const [timerLoading, setTimerLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerAction, setTimerAction] = useState("ON");
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [timerBusy, setTimerBusy] = useState(false);
  const [timerError, setTimerError] = useState("");

  // --- Schedules ---
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedBusy, setSchedBusy] = useState(false);
  const [schedError, setSchedError] = useState("");
  const [schedAction, setSchedAction] = useState("ON");
  const [schedType, setSchedType] = useState("daily");
  const [schedTime, setSchedTime] = useState("08:00");
  const [schedDays, setSchedDays] = useState([1, 2, 3, 4, 5]);
  const [schedDate, setSchedDate] = useState("");
  const schedTimezone = defaultTimezone;  // derived — no setter needed
  const [schedEnabled, setSchedEnabled] = useState(true);
  const [schedEndTime, setSchedEndTime] = useState("");   // "" = no end-time (trigger-only)

  const timerTicker = useRef(null);
  // Guards the zero-crossing refetch: when the countdown hits 0 we fetch once
  // (the engine may keep the timer "active" briefly during its retry window) —
  // without this guard a still-active response would refetch forever.
  const expiryFiredRef = useRef(false);

  const loadTimer = useCallback(async () => {
    if (!productId || !controlKey) return;
    setTimerLoading(true);
    try {
      const t = await fetchActiveTimer(productId, controlKey);
      setTimer(t);
      if (t) setNow(Date.now());
    } catch (err) {
      console.error("Failed to load timer:", err.message);
    } finally {
      setTimerLoading(false);
    }
  }, [productId, controlKey]);

  const loadSchedules = useCallback(async () => {
    if (!productId || !controlKey) return;
    setSchedLoading(true);
    try {
      setSchedules(await fetchSchedules(productId, controlKey));
    } catch (err) {
      console.error("Failed to load schedules:", err.message);
    } finally {
      setSchedLoading(false);
    }
  }, [productId, controlKey]);

  // Countdown ticker — recompute remaining every second while a timer is active.
  useEffect(() => {
    if (!timer?.expiresAt) {
      if (timerTicker.current) clearInterval(timerTicker.current);
      return undefined;
    }
    timerTicker.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (timerTicker.current) clearInterval(timerTicker.current);
    };
  }, [timer?.expiresAt]);

  // When the countdown reaches zero the engine has already reversed the action —
  // refetch once so the chip disappears (or shows the next active timer).
  const remaining = timer?.expiresAt ? Math.max(0, timer.expiresAt - now) : 0;
  useEffect(() => {
    if (timer?.expiresAt && remaining <= 0) {
      if (!expiryFiredRef.current) {
        expiryFiredRef.current = true;
        loadTimer();
      }
    } else if (remaining > 0) {
      expiryFiredRef.current = false;
    }
  }, [remaining, timer, loadTimer]);

  useEffect(() => {
    if (timerOpen) loadTimer();
  }, [timerOpen, loadTimer]);

  useEffect(() => {
    if (schedOpen) loadSchedules();
  }, [schedOpen, loadSchedules]);

  // Load the active timer on mount so an existing timer shows its countdown
  // immediately, and so the escape hatch can detect it on gated (v1) rows.
  useEffect(() => {
    loadTimer();
  }, [loadTimer]);

  // Escape hatch for schedules: only when gating would hide the Schedule
  // button, check whether schedules already exist (otherwise schedules are
  // fetched when the modal opens).
  useEffect(() => {
    if (!canSchedule) loadSchedules();
  }, [canSchedule, loadSchedules]);

  const notifyChanged = () => {
    if (typeof onChanged === "function") onChanged();
  };

  const handleStartTimer = async () => {
    if (!timerMinutes || timerMinutes <= 0) {
      setTimerError("Enter a duration greater than 0 minutes");
      return;
    }
    setTimerBusy(true);
    setTimerError("");
    try {
      const t = await startTimer(productId, controlKey, {
        action: timerAction,
        durationSeconds: Math.round(Number(timerMinutes) * 60),
      });
      setTimer(t);
      setNow(Date.now());
      setTimerOpen(false);
      notifyChanged();
    } catch (err) {
      setTimerError(err.message);
    } finally {
      setTimerBusy(false);
    }
  };

  const handleCancelTimer = async () => {
    setTimerBusy(true);
    setTimerError("");
    try {
      await cancelTimer(productId, controlKey);
      setTimer(null);
      setTimerOpen(false);
      notifyChanged();
    } catch (err) {
      setTimerError(err.message);
    } finally {
      setTimerBusy(false);
    }
  };

  const toggleDay = (day) =>
    setSchedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const handleCreateSchedule = async () => {
    setSchedBusy(true);
    setSchedError("");
    try {
      // Validate end time if provided
      if (schedEndTime && schedEndTime === schedTime) {
        throw new Error("Start time and end time cannot be the same");
      }
      const payload = {
        action: schedAction,
        scheduleType: schedType,
        startTime: schedTime,          // preferred v2 field
        time: schedTime,               // kept for backward compat
        timezone: schedTimezone,
        enabled: schedEnabled,
      };
      // Only include endTime when the user actually set one
      if (schedEndTime) payload.endTime = schedEndTime;
      if (schedType === "weekly") payload.days = schedDays;
      if (schedType === "once") {
        if (!schedDate) throw new Error("Pick a date for a one-time schedule");
        payload.startDate = new Date(`${schedDate}T${schedTime}:00`).toISOString();
      }
      await createSchedule(productId, controlKey, payload);
      setSchedError("");
      setSchedEndTime(""); // reset end time after success
      await loadSchedules();
    } catch (err) {
      setSchedError(err.message);
    } finally {
      setSchedBusy(false);
    }
  };

  const handleToggleSchedule = async (s) => {
    try {
      await updateSchedule(productId, controlKey, s.id, { enabled: !s.enabled });
      await loadSchedules();
    } catch (err) {
      setSchedError(err.message);
    }
  };

  const handleDeleteSchedule = async (s) => {
    try {
      await deleteSchedule(productId, controlKey, s.id);
      await loadSchedules();
    } catch (err) {
      setSchedError(err.message);
    }
  };

  const hasTimerUI = !!timer || canTimer;
  const hasScheduleUI = canSchedule || schedules.length > 0;
  if (!hasTimerUI && !hasScheduleUI) return null;

  return (
    <>
      <Box className="control-timers">
        {/* Active timer chip with live countdown */}
        {timer ? (
          <Tooltip title={`Timer: ${timer.action === "ON" ? "ON" : "OFF"} → reverse in ${formatRemaining(remaining)}`} arrow>
            <Box className={`ct-timer-chip ${timer.action === "ON" ? "ct-on" : "ct-off"}`}>
              <TimerOutlined fontSize="small" />
              <Box className="ct-chip-text">
                <Typography variant="caption" className="ct-chip-label">
                  Timer · {timer.action === "ON" ? "ON" : "OFF"}
                </Typography>
                <Typography variant="body2" className="ct-chip-count">
                  {formatRemaining(remaining)}
                </Typography>
              </Box>
              <IconButton
                size="small"
                className="ct-chip-cancel"
                onClick={() => setTimerOpen(true)}
                title="Manage timer"
                aria-label="Manage timer"
              >
                <StopCircle fontSize="small" />
              </IconButton>
            </Box>
          </Tooltip>
        ) : canTimer ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<TimerOutlined />}
            onClick={() => setTimerOpen(true)}
            className="ct-action-btn"
            disabled={timerLoading}
          >
            Timer
          </Button>
        ) : null}

        {(canSchedule || schedules.length > 0) && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={() => setSchedOpen(true)}
            className="ct-action-btn"
          >
            Schedule
          </Button>
        )}
      </Box>

      {/* ---------- Timer modal ---------- */}
      <Dialog open={timerOpen} onClose={() => setTimerOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="ct-dialog-title">
          <Box style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <Box style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TimerOutlined style={{ color: "var(--primary-color)", fontSize: "1.25rem" }} />
              <span style={{ fontWeight: 800 }}>{timer ? "Active Timer" : "Set Timer"}</span>
            </Box>
            <Typography variant="caption" style={{ color: "var(--text-secondary)", fontWeight: 700, marginLeft: "28px" }}>
              Controller: {control.name || control.pin}
            </Typography>
          </Box>
          <IconButton className="ct-dialog-close" onClick={() => setTimerOpen(false)} aria-label="Close">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {!timer && (
            <Box className="ct-info-banner" style={{
              background: "rgba(0, 242, 155, 0.04)",
              border: "1px dashed rgba(0, 242, 155, 0.2)",
              borderRadius: "10px",
              padding: "10px 14px",
              marginBottom: "16px",
              fontSize: "0.82rem",
              color: "var(--text-color)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-family-jakarta)"
            }}>
              ℹ️ Timer mode triggers the action immediately and reverts it automatically when the countdown reaches 0.
            </Box>
          )}
          {timer ? (
            <Box className="ct-active">
              <Typography variant="body1" className="ct-active-label">
                {timer.action === "ON" ? "Turned ON" : "Turned OFF"} — reverses in
              </Typography>
              <Typography variant="h4" className="ct-active-count">
                {formatRemaining(remaining)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Started {new Date(timer.startedAt).toLocaleString()}
              </Typography>
              <Button
                variant="contained"
                color="error"
                fullWidth
                startIcon={<StopCircle />}
                onClick={handleCancelTimer}
                disabled={timerBusy}
                sx={{ mt: 2 }}
              >
                Cancel Timer
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                ⚡ Select Action
              </Typography>
              <Box className="ct-action-toggle">
                <Button
                  variant={timerAction === "ON" ? "contained" : "outlined"}
                  color="success"
                  size="small"
                  onClick={() => setTimerAction("ON")}
                >
                  Turn ON
                </Button>
                <Button
                  variant={timerAction === "OFF" ? "contained" : "outlined"}
                  color="error"
                  size="small"
                  onClick={() => setTimerAction("OFF")}
                >
                  Turn OFF
                </Button>
              </Box>

              <Typography variant="subtitle2" sx={{ mt: 2.5, mb: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                ⏱️ Duration Presets
              </Typography>
              <Box className="ct-presets">
                {PRESETS_MIN.map((m) => (
                  <Chip
                    key={m}
                    label={`${m} min`}
                    size="small"
                    clickable
                    color={timerMinutes === m ? "primary" : "default"}
                    onClick={() => setTimerMinutes(m)}
                  />
                ))}
              </Box>
              <TextField
                type="number"
                label="Minutes"
                size="small"
                fullWidth
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(e.target.value)}
                inputProps={{ min: 1, step: 1 }}
                sx={{ mt: 1.5 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                The action applies immediately; the backend reverses it automatically after the duration — even with the app closed.
              </Typography>
              {timerError && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{timerError}</Typography>}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<PlayArrow />}
                onClick={handleStartTimer}
                disabled={timerBusy}
                sx={{ mt: 2 }}
              >
                {timerBusy ? <CircularProgress size={20} color="inherit" /> : "Start Timer"}
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Schedule modal ---------- */}
      <Dialog open={schedOpen} onClose={() => setSchedOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="ct-dialog-title">
          <Box style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <Box style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ScheduleIcon style={{ color: "var(--primary-color)", fontSize: "1.25rem" }} />
              <span style={{ fontWeight: 800 }}>Schedules</span>
            </Box>
            <Typography variant="caption" style={{ color: "var(--text-secondary)", fontWeight: 700, marginLeft: "28px" }}>
              Controller: {control.name || control.pin}
            </Typography>
          </Box>
          <IconButton className="ct-dialog-close" onClick={() => setSchedOpen(false)} aria-label="Close">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box className="ct-info-banner" style={{
            background: "rgba(0, 242, 155, 0.04)",
            border: "1px dashed rgba(0, 242, 155, 0.2)",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "0.82rem",
            color: "var(--text-color)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "var(--font-family-jakarta)"
          }}>
            ℹ️ Schedules execute recurring triggers at specific times, running entirely on the device even when offline.
          </Box>

          {/* Existing schedules */}
          <Typography variant="subtitle2" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: "6px" }}>
            📋 Configured Schedules
          </Typography>
          {schedLoading ? (
            <Box className="ct-center"><CircularProgress size={22} /></Box>
          ) : schedules.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No schedules yet — the backend executes these even when the app is closed.
            </Typography>
          ) : (
            <Box className="ct-sched-list">
              {schedules.map((s) => (
                <Box key={s.id} className="ct-sched-item">
                  <Box className="ct-sched-icon">
                    {s.scheduleType === "once" ? <Event /> : s.scheduleType === "weekly" ? <Today /> : <EventRepeat />}
                  </Box>
                  <Box className="ct-sched-body">
                    <Typography variant="body2" className={s.enabled ? "" : "ct-disabled"}>
                      {describeSchedule(s)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.timezone} · {s.runs || 0} run{(s.runs || 0) === 1 ? "" : "s"}
                      {s.endTime && (
                        <Chip
                          label={`↩ OFF at ${s.endTime}`}
                          size="small"
                          variant="outlined"
                          color="warning"
                          sx={{ ml: 1, height: 18, fontSize: "0.65rem", verticalAlign: "middle" }}
                        />
                      )}
                    </Typography>
                  </Box>
                  <Tooltip title={s.enabled ? "Disable" : "Enable"}>
                    <Switch
                      size="small"
                      checked={s.enabled}
                      onChange={() => handleToggleSchedule(s)}
                    />
                  </Tooltip>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteSchedule(s)}
                    aria-label="Delete schedule"
                    className="ct-delete-btn"
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          <Divider sx={{ my: 2.5 }} />

          {/* Add schedule */}
          <Typography variant="subtitle2" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: "6px" }}>
            ➕ Create New Schedule
          </Typography>
          <Box className="ct-form-grid" style={{
            background: "rgba(255, 255, 255, 0.01)",
            border: "1px solid var(--card-border)",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "8px"
          }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Action</InputLabel>
              <Select label="Action" value={schedAction} onChange={(e) => setSchedAction(e.target.value)}>
                <MenuItem value="ON" style={{ color: "var(--color-success)", fontWeight: 800 }}>⚡ Turn ON</MenuItem>
                <MenuItem value="OFF" style={{ color: "var(--color-error)", fontWeight: 800 }}>🔌 Turn OFF</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Repeat</InputLabel>
              <Select label="Repeat" value={schedType} onChange={(e) => setSchedType(e.target.value)}>
                <MenuItem value="once">📅 Once (Single Run)</MenuItem>
                <MenuItem value="daily">🔁 Daily (Every Day)</MenuItem>
                <MenuItem value="weekly">🗓️ Weekly (Custom Days)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              type="time"
              label="Start Time"
              size="small"
              fullWidth
              value={schedTime}
              onChange={(e) => setSchedTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="time"
              label="End Time (optional)"
              size="small"
              fullWidth
              value={schedEndTime}
              onChange={(e) => setSchedEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: schedEndTime ? (
                  <Tooltip title="Remove end time (trigger-only schedule)">
                    <IconButton size="small" onClick={() => setSchedEndTime("")}>
                      <Close fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null,
              }}
              helperText={schedEndTime ? `Device automatically turns OFF at ${schedEndTime}` : "Optional: Auto-turns off to create window"}
            />
            <TextField
              type="date"
              label="Date (once)"
              size="small"
              fullWidth
              value={schedDate}
              onChange={(e) => setSchedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={schedType !== "once"}
            />
          </Box>

          {schedType === "weekly" && (
            <Box className="ct-days" sx={{ mt: 1.5 }}>
              {DAY_LABELS.map((label, idx) => (
                <FormControlLabel
                  key={label}
                  control={
                    <Checkbox
                      size="small"
                      checked={schedDays.includes(idx)}
                      onChange={() => toggleDay(idx)}
                    />
                  }
                  label={label}
                  className="ct-day-label"
                />
              ))}
            </Box>
          )}

          <FormControlLabel
            sx={{ mt: 1.5, display: "flex" }}
            control={<Switch size="small" checked={schedEnabled} onChange={(e) => setSchedEnabled(e.target.checked)} />}
            label="Enabled"
          />

          {schedError && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{schedError}</Typography>}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<Add />}
            onClick={handleCreateSchedule}
            disabled={schedBusy}
            sx={{ mt: 2 }}
          >
            {schedBusy ? <CircularProgress size={20} color="inherit" /> : "Add Schedule"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

ControlTimers.propTypes = {
  productId: PropTypes.string.isRequired,
  control: PropTypes.shape({
    controlId: PropTypes.string,
    pin: PropTypes.string,
  }).isRequired,
  onChanged: PropTypes.func,
  capabilities: PropTypes.shape({
    timer: PropTypes.bool,
    schedule: PropTypes.bool,
  }),
};

export default ControlTimers;
