import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
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
  EventRepeat,
  Event,
  Today,
} from "@mui/icons-material";
import {
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  sendTimerCommand,
} from "../../api/controlTimers";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import "./ControlTimers.scss";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

const ControlTimers = ({
  productId,
  productUid,
  control,
  onChanged,
  capabilities,
  onPowerStateChange,
  publishCommandWithFeedback,
}) => {
  const controlKey = control.controlId || control.pin;
  const defaultTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    []
  );

  const canTimer = capabilities ? capabilities.timer !== false : true;
  const canSchedule = capabilities ? capabilities.schedule !== false : true;

  // ─── Part 1: Controller Hardware Timers State ─────────────────────────────
  // appliedTimer: confirmed from device/backend
  const appliedTimer = useMemo(() => ({
    enabled: Boolean(control?.timer?.enabled),
    onTime: Number(control?.timer?.onTime) || 0,
    offTime: Number(control?.timer?.offTime) || 0,
  }), [control?.timer?.enabled, control?.timer?.onTime, control?.timer?.offTime]);

  // draftTimer: current form values being edited by the user
  const [draftTimer, setDraftTimer] = useState({
    enabled: Boolean(control?.timer?.enabled),
    onTime: Number(control?.timer?.onTime) || 0,
    offTime: Number(control?.timer?.offTime) || 0,
  });

  const [timerOpen, setTimerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize draft state when applied state updates from backend/product change
  useEffect(() => {
    setDraftTimer(appliedTimer);
  }, [appliedTimer]);

  // Compute dirty state (§1: UI Behavior & State Logic)
  const isDirty =
    draftTimer.enabled !== appliedTimer.enabled ||
    (draftTimer.enabled &&
      (Number(draftTimer.onTime) !== Number(appliedTimer.onTime) ||
        Number(draftTimer.offTime) !== Number(appliedTimer.offTime)));

  const isValid =
    !draftTimer.enabled ||
    (Number(draftTimer.onTime) > 0 && Number(draftTimer.offTime) > 0);

  // ─── Part 1: Apply Timer Command (§2 & §3) ───────────────────────────────
  const handleApplyTimer = async () => {
    if (!isDirty || !isValid || isSubmitting) return;

    setIsSubmitting(true);

    const payload = draftTimer.enabled
      ? {
          command: "setTimer",
          pin: control.pin,
          timer_enabled: true,
          on_time: Number(draftTimer.onTime),
          off_time: Number(draftTimer.offTime),
        }
      : {
          command: "setTimer",
          pin: control.pin,
          timer_enabled: false,
        };

    const handleSuccess = (feedback) => {
      // 1. Update appliedTimer = { ...draftTimer } (handled via refetch or parent state)
      // 2. If state: "OFF" was returned, set the power switch UI to OFF
      if (
        String(feedback?.state || "").toUpperCase() === "OFF" ||
        (!draftTimer.enabled && feedback?.state === undefined)
      ) {
        if (String(feedback?.state || "").toUpperCase() === "OFF") {
          onPowerStateChange?.(control.pin, "OFF");
        }
      }
      setIsSubmitting(false);
      setTimerOpen(false);
      onChanged?.();

      Swal.fire({
        icon: "success",
        title: "Timer Updated",
        text: draftTimer.enabled
          ? `Timer set to ${draftTimer.onTime}m ON / ${draftTimer.offTime}m OFF`
          : "Timer has been disabled.",
        timer: 2000,
        showConfirmButton: false,
      });
    };

    const handleFailure = () => {
      // Revert the timer toggle/inputs back to appliedTimer
      setDraftTimer({ ...appliedTimer });
      setIsSubmitting(false);
      Swal.fire({
        icon: "error",
        title: "Timer Update Failed",
        text: "Device did not respond. Timer update failed.",
      });
    };

    if (typeof publishCommandWithFeedback === "function") {
      publishCommandWithFeedback(
        payload,
        (feedback) => handleSuccess(feedback),
        () => handleFailure()
      );
    } else {
      // Fallback via REST API: POST /api/v1/command/timer
      try {
        const res = await sendTimerCommand({
          uid: productUid,
          ...payload,
        });
        if (res && res.status !== "error") {
          handleSuccess(res);
        } else {
          handleFailure();
        }
      } catch (err) {
        console.error("REST fallback timer command failed:", err);
        handleFailure();
      }
    }
  };

  // ─── Schedules State & Handlers ───────────────────────────────────────────
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
  const schedTimezone = defaultTimezone;
  const [schedEnabled, setSchedEnabled] = useState(true);
  const [schedEndTime, setSchedEndTime] = useState("");

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

  useEffect(() => {
    if (schedOpen) loadSchedules();
  }, [schedOpen, loadSchedules]);

  useEffect(() => {
    if (!canSchedule) loadSchedules();
  }, [canSchedule, loadSchedules]);

  const toggleDay = (day) =>
    setSchedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const handleCreateSchedule = async () => {
    setSchedBusy(true);
    setSchedError("");
    try {
      if (schedEndTime && schedEndTime === schedTime) {
        throw new Error("Start time and end time cannot be the same");
      }
      const payload = {
        action: schedAction,
        scheduleType: schedType,
        startTime: schedTime,
        time: schedTime,
        timezone: schedTimezone,
        enabled: schedEnabled,
      };
      if (schedEndTime) payload.endTime = schedEndTime;
      if (schedType === "weekly") payload.days = schedDays;
      if (schedType === "once") payload.startDate = schedDate;

      await createSchedule(productId, controlKey, payload);
      await loadSchedules();
      onChanged?.();
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

  const hasTimerUI = appliedTimer.enabled || canTimer;
  const hasScheduleUI = canSchedule || schedules.length > 0;
  if (!hasTimerUI && !hasScheduleUI) return null;

  return (
    <>
      <Box className="control-timers">
        {/* Active hardware timer chip or setup button */}
        {appliedTimer.enabled ? (
          <Tooltip
            title={`Hardware Cyclic Timer Active: ${appliedTimer.onTime}m ON / ${appliedTimer.offTime}m OFF. Click to configure.`}
            arrow
          >
            <Box
              className="ct-timer-chip ct-on"
              onClick={() => {
                setDraftTimer({ ...appliedTimer });
                setTimerOpen(true);
              }}
              style={{ cursor: "pointer" }}
            >
              <TimerOutlined fontSize="small" />
              <Box className="ct-chip-text">
                <Typography variant="caption" className="ct-chip-label">
                  Timer · ACTIVE
                </Typography>
                <Typography variant="body2" className="ct-chip-count">
                  {appliedTimer.onTime}m ON / {appliedTimer.offTime}m OFF
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        ) : canTimer ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<TimerOutlined />}
            onClick={() => {
              setDraftTimer({ ...appliedTimer });
              setTimerOpen(true);
            }}
            className="ct-action-btn"
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

      {/* ─── Hardware Cyclic Timer Modal ────────────────────────────────────── */}
      <Dialog
        open={timerOpen}
        onClose={() => {
          if (!isSubmitting) {
            setDraftTimer(appliedTimer);
            setTimerOpen(false);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle className="ct-dialog-title">
          <Box style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <Box style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TimerOutlined style={{ color: "var(--primary-color)", fontSize: "1.25rem" }} />
              <span style={{ fontWeight: 800 }}>Hardware Cyclic Timer</span>
            </Box>
            <Typography
              variant="caption"
              style={{ color: "var(--text-secondary)", fontWeight: 700, marginLeft: "28px" }}
            >
              Controller: {control.name || control.pin} ({control.pin})
            </Typography>
          </Box>
          <IconButton
            className="ct-dialog-close"
            onClick={() => {
              if (!isSubmitting) {
                setDraftTimer(appliedTimer);
                setTimerOpen(false);
              }
            }}
            aria-label="Close"
            disabled={isSubmitting}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* Status banner */}
          <Box className={`ct-status-banner ${appliedTimer.enabled ? "active" : "inactive"}`}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {appliedTimer.enabled
                ? `⚡ Hardware Timer is ACTIVE (${appliedTimer.onTime}m ON / ${appliedTimer.offTime}m OFF)`
                : "💤 Hardware Timer is DISABLED on device"}
            </Typography>
          </Box>

          {/* Timer Toggle: Controls whether the cyclic timer is active */}
          <Box className="ct-toggle-row">
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, m: 0 }}>
                Cyclic Timer
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {draftTimer.enabled
                  ? "Enabled — runs cyclic loop autonomously on device"
                  : "Disabled — operates in standard manual/automated mode"}
              </Typography>
            </Box>
            <Switch
              checked={Boolean(draftTimer.enabled)}
              disabled={isSubmitting}
              onChange={(e) => setDraftTimer((prev) => ({ ...prev, enabled: e.target.checked }))}
              color="primary"
            />
          </Box>

          {/* ON & OFF Timing Inputs: Only display when timer toggle is Enabled */}
          {draftTimer.enabled && (
            <Box className="ct-timing-inputs" sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                Configure cycle durations in minutes. The device will switch ON for ON Time, then OFF for OFF Time, repeating continuously.
              </Typography>

              <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
                <TextField
                  type="number"
                  label="ON Time (minutes)"
                  size="small"
                  fullWidth
                  value={draftTimer.onTime || ""}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Math.max(1, Number(e.target.value));
                    setDraftTimer((prev) => ({ ...prev, onTime: val }));
                  }}
                  inputProps={{ min: 1, step: 1 }}
                  error={draftTimer.enabled && (!draftTimer.onTime || Number(draftTimer.onTime) <= 0)}
                  helperText={
                    draftTimer.enabled && (!draftTimer.onTime || Number(draftTimer.onTime) <= 0)
                      ? "Required (> 0 min)"
                      : ""
                  }
                />
                <TextField
                  type="number"
                  label="OFF Time (minutes)"
                  size="small"
                  fullWidth
                  value={draftTimer.offTime || ""}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Math.max(1, Number(e.target.value));
                    setDraftTimer((prev) => ({ ...prev, offTime: val }));
                  }}
                  inputProps={{ min: 1, step: 1 }}
                  error={draftTimer.enabled && (!draftTimer.offTime || Number(draftTimer.offTime) <= 0)}
                  helperText={
                    draftTimer.enabled && (!draftTimer.offTime || Number(draftTimer.offTime) <= 0)
                      ? "Required (> 0 min)"
                      : ""
                  }
                />
              </Box>

              <Typography variant="caption" sx={{ fontWeight: 600, color: "var(--text-secondary)", mb: 0.8, display: "block" }}>
                Presets (ON / OFF):
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                {[
                  { label: "5m / 15m", on: 5, off: 15 },
                  { label: "10m / 20m", on: 10, off: 20 },
                  { label: "15m / 45m", on: 15, off: 45 },
                  { label: "30m / 60m", on: 30, off: 60 },
                ].map((p) => (
                  <Chip
                    key={p.label}
                    label={p.label}
                    size="small"
                    clickable={!isSubmitting}
                    color={
                      Number(draftTimer.onTime) === p.on && Number(draftTimer.offTime) === p.off
                        ? "primary"
                        : "default"
                    }
                    onClick={() => {
                      if (!isSubmitting) {
                        setDraftTimer((prev) => ({ ...prev, onTime: p.on, offTime: p.off }));
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* "Apply Timer" Button Visibility: Show ONLY when isDirty === true */}
          {isDirty ? (
            <Box sx={{ mt: 2.5 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                disabled={isSubmitting || !isValid}
                onClick={handleApplyTimer}
                startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <PlayArrow />}
              >
                {isSubmitting
                  ? "Applying to Device..."
                  : draftTimer.enabled
                  ? "Apply Timer"
                  : "Disable Timer"}
              </Button>
              {!isValid && draftTimer.enabled && (
                <Typography variant="caption" color="error" sx={{ display: "block", textAlign: "center", mt: 0.5 }}>
                  Please enter positive numbers for ON and OFF times.
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 2 }}>
              ✓ Current timer matches device configuration.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Schedule Modal ─────────────────────────────────────────────────── */}
      <Dialog open={schedOpen} onClose={() => setSchedOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="ct-dialog-title">
          <Box style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <Box style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ScheduleIcon style={{ color: "var(--primary-color)", fontSize: "1.25rem" }} />
              <span style={{ fontWeight: 800 }}>Schedules</span>
            </Box>
            <Typography
              variant="caption"
              style={{ color: "var(--text-secondary)", fontWeight: 700, marginLeft: "28px" }}
            >
              Controller: {control.name || control.pin}
            </Typography>
          </Box>
          <IconButton className="ct-dialog-close" onClick={() => setSchedOpen(false)} aria-label="Close">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            className="ct-info-banner"
            style={{
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
              fontFamily: "var(--font-family-jakarta)",
            }}
          >
            ℹ️ Schedules execute recurring triggers at specific times, running entirely on the device even when offline.
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: "6px" }}>
            📋 Configured Schedules
          </Typography>
          {schedLoading ? (
            <Box className="ct-center">
              <CircularProgress size={22} />
            </Box>
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
                    <Switch size="small" checked={s.enabled} onChange={() => handleToggleSchedule(s)} />
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

          <Typography variant="subtitle2" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: "6px" }}>
            ➕ Create New Schedule
          </Typography>
          <Box
            className="ct-form-grid"
            style={{
              background: "rgba(255, 255, 255, 0.01)",
              border: "1px solid var(--card-border)",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "8px",
            }}
          >
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
  productUid: PropTypes.string,
  control: PropTypes.shape({
    controlId: PropTypes.string,
    pin: PropTypes.string,
    name: PropTypes.string,
    timer: PropTypes.shape({
      enabled: PropTypes.bool,
      onTime: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      offTime: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      lastConfiguredAt: PropTypes.string,
    }),
    state: PropTypes.string,
    stateVersion: PropTypes.number,
  }).isRequired,
  onChanged: PropTypes.func,
  capabilities: PropTypes.shape({
    timer: PropTypes.bool,
    schedule: PropTypes.bool,
  }),
  onPowerStateChange: PropTypes.func,
  publishCommandWithFeedback: PropTypes.func,
};

export default ControlTimers;
