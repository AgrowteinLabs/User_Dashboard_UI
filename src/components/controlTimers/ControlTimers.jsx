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
  Switch,
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
  CloudQueue,
  Memory,
  PowerSettingsNew,
  PowerOff,
  CheckCircleOutline,
  EventRepeat,
  CalendarToday,
  ArrowForward,
  Remove,
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
const DAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

const REPEAT_OPTIONS = [
  { value: "once", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
  { value: "weekly", label: "Custom" },
];

const TIMER_PRESETS = [
  { label: "5m / 15m", on: 5, off: 15 },
  { label: "10m / 20m", on: 10, off: 20 },
  { label: "15m / 45m", on: 15, off: 45 },
  { label: "30m / 60m", on: 30, off: 60 },
];

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTime12h = (timeStr) => {
  if (!timeStr || !timeStr.includes(":")) return timeStr || "--:--";
  const [hRaw, mRaw] = timeStr.split(":");
  const h = Number(hRaw);
  if (Number.isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mRaw} ${period}`;
};

const formatDateReadable = (dateStr) => {
  if (!dateStr) return "";
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatFrequencyLabel = (s) => {
  if (s.scheduleType === "once") {
    return `Once · ${formatDateReadable(s.startDate)}`;
  }
  const daysArr = Array.isArray(s.days) ? s.days.map(Number) : [];
  if (daysArr.length === 7 || s.scheduleType === "daily") {
    return "Every day";
  }
  const sortedDays = daysArr.slice().sort((a, b) => a - b).join(",");
  if (sortedDays === "1,2,3,4,5" || s.scheduleType === "weekdays") {
    return "Weekdays (Mon–Fri)";
  }
  if (sortedDays === "0,6" || s.scheduleType === "weekends") {
    return "Weekends (Sat–Sun)";
  }
  if (daysArr.length > 0) {
    return daysArr
      .slice()
      .sort((a, b) => a - b)
      .map((d) => DAY_LABELS[d])
      .filter(Boolean)
      .join(", ");
  }
  return "Custom";
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
  const appliedTimer = useMemo(
    () => ({
      enabled: Boolean(control?.timer?.enabled),
      onTime: Number(control?.timer?.onTime) || 0,
      offTime: Number(control?.timer?.offTime) || 0,
    }),
    [control?.timer?.enabled, control?.timer?.onTime, control?.timer?.offTime]
  );

  const [draftTimer, setDraftTimer] = useState({
    enabled: Boolean(control?.timer?.enabled),
    onTime: Number(control?.timer?.onTime) || 0,
    offTime: Number(control?.timer?.offTime) || 0,
  });

  const [timerOpen, setTimerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDraftTimer(appliedTimer);
  }, [appliedTimer]);

  const isDirty =
    draftTimer.enabled !== appliedTimer.enabled ||
    (draftTimer.enabled &&
      (Number(draftTimer.onTime) !== Number(appliedTimer.onTime) ||
        Number(draftTimer.offTime) !== Number(appliedTimer.offTime)));

  const isValid =
    !draftTimer.enabled ||
    (Number(draftTimer.onTime) > 0 && Number(draftTimer.offTime) > 0);

  const totalCycleMinutes =
    (Number(draftTimer.onTime) || 0) + (Number(draftTimer.offTime) || 0);
  const onPercent =
    totalCycleMinutes > 0
      ? Math.min(85, Math.max(15, (Number(draftTimer.onTime) / totalCycleMinutes) * 100))
      : 50;

  // ─── Part 1: Apply Timer Command ──────────────────────────────────────────
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

  const adjustDuration = (field, delta) => {
    if (isSubmitting) return;
    setDraftTimer((prev) => {
      const current = Number(prev[field]) || 0;
      const next = Math.max(1, current + delta);
      return { ...prev, [field]: next };
    });
  };

  // ─── Schedules State & Handlers ───────────────────────────────────────────
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedTab, setSchedTab] = useState("list"); // "list" | "create"
  const [schedules, setSchedules] = useState([]);
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedBusy, setSchedBusy] = useState(false);
  const [schedError, setSchedError] = useState("");
  const [schedAction, setSchedAction] = useState("ON");
  const [schedType, setSchedType] = useState("daily");
  const [schedTime, setSchedTime] = useState("08:00");
  const [schedDays, setSchedDays] = useState([1, 2, 3, 4, 5]);
  const [schedDate, setSchedDate] = useState(getTodayDateString());
  const schedTimezone = defaultTimezone;
  const [schedEnabled, setSchedEnabled] = useState(true);
  const [schedEndTime, setSchedEndTime] = useState("");

  const loadSchedules = useCallback(async () => {
    if (!productId || !controlKey) return;
    setSchedLoading(true);
    try {
      const list = await fetchSchedules(productId, controlKey);
      setSchedules(list);
      return list;
    } catch (err) {
      console.error("Failed to load schedules:", err.message);
      return [];
    } finally {
      setSchedLoading(false);
    }
  }, [productId, controlKey]);

  useEffect(() => {
    if (schedOpen) {
      setSchedError("");
      loadSchedules().then((list) => {
        if (Array.isArray(list) && list.length === 0) {
          setSchedTab("create");
        } else {
          setSchedTab("list");
        }
      });
    }
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
      if (!schedTime) {
        throw new Error("Start time is required");
      }
      if (schedAction === "ON" && schedEndTime && schedEndTime === schedTime) {
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

      if (schedAction === "ON" && schedEndTime) {
        payload.endTime = schedEndTime;
      }

      if (schedType === "once") {
        if (!schedDate) {
          throw new Error("Please select an execution date");
        }
        payload.startDate = schedDate;
      } else {
        if (schedType === "daily") {
          payload.days = [0, 1, 2, 3, 4, 5, 6];
        } else if (schedType === "weekdays") {
          payload.days = [1, 2, 3, 4, 5];
        } else if (schedType === "weekends") {
          payload.days = [0, 6];
        } else if (schedType === "weekly") {
          if (!schedDays || schedDays.length === 0) {
            throw new Error("Please select at least one day of the week");
          }
          payload.days = schedDays.slice().sort((a, b) => a - b);
        }
      }

      await createSchedule(productId, controlKey, payload);
      await loadSchedules();
      onChanged?.();
      setSchedTab("list");

      Swal.fire({
        icon: "success",
        title: "Schedule Saved",
        text:
          schedType === "once"
            ? `Scheduled for ${formatDateReadable(schedDate)} at ${formatTime12h(schedTime)}`
            : `Recurring schedule set for ${formatTime12h(schedTime)}`,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (err) {
      setSchedError(err.message);
    } finally {
      setSchedBusy(false);
    }
  };

  const handleToggleSchedule = async (s) => {
    const scheduleId = s.id || s._id;
    try {
      await updateSchedule(productId, controlKey, scheduleId, { enabled: !s.enabled });
      await loadSchedules();
      onChanged?.();
    } catch (err) {
      setSchedError(err.message);
    }
  };

  const handleDeleteSchedule = async (s) => {
    const scheduleId = s.id || s._id;
    try {
      await deleteSchedule(productId, controlKey, scheduleId);
      await loadSchedules();
      onChanged?.();
    } catch (err) {
      setSchedError(err.message);
    }
  };

  const liveScheduleSummary = useMemo(() => {
    const actionWord = schedAction === "ON" ? "Turn ON" : "Turn OFF";
    let whenStr = "every day";
    if (schedType === "once") {
      whenStr = `once on ${formatDateReadable(schedDate) || "selected date"}`;
    } else if (schedType === "weekdays") {
      whenStr = "on weekdays (Mon–Fri)";
    } else if (schedType === "weekends") {
      whenStr = "on weekends (Sat–Sun)";
    } else if (schedType === "weekly") {
      whenStr =
        schedDays.length > 0
          ? `every ${schedDays
              .slice()
              .sort((a, b) => a - b)
              .map((d) => DAY_LABELS[d])
              .join(", ")}`
          : "on selected days";
    }
    const timePart = `at ${formatTime12h(schedTime)}`;
    const endPart =
      schedAction === "ON" && schedEndTime
        ? `, then automatically turn OFF at ${formatTime12h(schedEndTime)}`
        : "";
    return `${actionWord} ${whenStr} ${timePart}${endPart}.`;
  }, [schedAction, schedType, schedDate, schedDays, schedTime, schedEndTime]);

  const hasTimerUI = appliedTimer.enabled || canTimer;
  const hasScheduleUI = canSchedule || schedules.length > 0;
  if (!hasTimerUI && !hasScheduleUI) return null;

  return (
    <>
      <Box className="control-timers">
        {appliedTimer.enabled ? (
          <Tooltip
            title={`Cyclic Timer Active: ${appliedTimer.onTime}m ON / ${appliedTimer.offTime}m OFF. Click to edit.`}
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

      {/* ─── Redesigned Cyclic Timer Modal ───────────────────────────────────── */}
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
        className="ct-modal-dialog"
      >
        <DialogTitle className="ct-dialog-title">
          <Box className="ct-title-left">
            <Box className="ct-title-icon">
              <TimerOutlined />
            </Box>
            <Box className="ct-title-meta">
              <span className="ct-title-heading">Cyclic Timer</span>
              <Box className="ct-title-sub">
                <span>{control.name || control.pin}</span>
                <span className="ct-pin-badge">{control.pin}</span>
              </Box>
            </Box>
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

        <DialogContent className="ct-dialog-content">
          {/* Live Device Status Pill */}
          <Box className={`ct-status-pill ${appliedTimer.enabled ? "is-active" : "is-idle"}`}>
            <span className="ct-status-dot" />
            <span className="ct-status-text">
              {appliedTimer.enabled
                ? `Running on device · ${appliedTimer.onTime}m ON / ${appliedTimer.offTime}m OFF`
                : "Timer is currently off on device"}
            </span>
          </Box>

          {/* Master Toggle Card */}
          <Box
            className={`ct-master-toggle ${draftTimer.enabled ? "is-enabled" : ""}`}
            onClick={() => {
              if (!isSubmitting) {
                setDraftTimer((prev) => ({ ...prev, enabled: !prev.enabled }));
              }
            }}
          >
            <Box className="ct-master-copy">
              <Typography className="ct-master-title">Auto-Repeat Cycle</Typography>
              <Typography className="ct-master-desc">
                {draftTimer.enabled
                  ? "Turns ON and OFF automatically in a continuous loop"
                  : "Enable to alternate ON and OFF automatically"}
              </Typography>
            </Box>
            <Switch
              checked={Boolean(draftTimer.enabled)}
              disabled={isSubmitting}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) =>
                setDraftTimer((prev) => ({ ...prev, enabled: e.target.checked }))
              }
              color="primary"
            />
          </Box>

          {/* Duration Controls (visible when enabled) */}
          {draftTimer.enabled && (
            <Box className="ct-timer-body">
              <Box className="ct-duration-grid">
                {/* ON Duration Card */}
                <Box className="ct-duration-card is-on">
                  <Box className="ct-duration-head">
                    <span className="ct-dot-on" />
                    <span>Run Time (ON)</span>
                  </Box>
                  <Box className="ct-stepper-row">
                    <IconButton
                      size="small"
                      className="ct-step-btn"
                      disabled={isSubmitting || Number(draftTimer.onTime) <= 1}
                      onClick={() => adjustDuration("onTime", -5)}
                      aria-label="Decrease ON minutes"
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <TextField
                      type="number"
                      size="small"
                      variant="standard"
                      value={draftTimer.onTime || ""}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? "" : Math.max(1, Number(e.target.value));
                        setDraftTimer((prev) => ({ ...prev, onTime: val }));
                      }}
                      inputProps={{ min: 1, step: 1, className: "ct-num-input" }}
                      InputProps={{ disableUnderline: true }}
                    />
                    <IconButton
                      size="small"
                      className="ct-step-btn"
                      disabled={isSubmitting}
                      onClick={() => adjustDuration("onTime", 5)}
                      aria-label="Increase ON minutes"
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography className="ct-unit-label">minutes ON</Typography>
                </Box>

                {/* OFF Duration Card */}
                <Box className="ct-duration-card is-off">
                  <Box className="ct-duration-head">
                    <span className="ct-dot-off" />
                    <span>Rest Time (OFF)</span>
                  </Box>
                  <Box className="ct-stepper-row">
                    <IconButton
                      size="small"
                      className="ct-step-btn"
                      disabled={isSubmitting || Number(draftTimer.offTime) <= 1}
                      onClick={() => adjustDuration("offTime", -5)}
                      aria-label="Decrease OFF minutes"
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <TextField
                      type="number"
                      size="small"
                      variant="standard"
                      value={draftTimer.offTime || ""}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? "" : Math.max(1, Number(e.target.value));
                        setDraftTimer((prev) => ({ ...prev, offTime: val }));
                      }}
                      inputProps={{ min: 1, step: 1, className: "ct-num-input" }}
                      InputProps={{ disableUnderline: true }}
                    />
                    <IconButton
                      size="small"
                      className="ct-step-btn"
                      disabled={isSubmitting}
                      onClick={() => adjustDuration("offTime", 5)}
                      aria-label="Increase OFF minutes"
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography className="ct-unit-label">minutes OFF</Typography>
                </Box>
              </Box>

              {/* Visual Cycle Timeline */}
              {isValid && totalCycleMinutes > 0 && (
                <Box className="ct-cycle-preview">
                  <Box className="ct-cycle-bar">
                    <Box className="ct-bar-on" style={{ width: `${onPercent}%` }}>
                      <span>{draftTimer.onTime}m ON</span>
                    </Box>
                    <Box className="ct-bar-off" style={{ width: `${100 - onPercent}%` }}>
                      <span>{draftTimer.offTime}m OFF</span>
                    </Box>
                  </Box>
                  <Typography className="ct-cycle-summary">
                    Repeats every <strong>{totalCycleMinutes} min</strong> — runs{" "}
                    <strong>{draftTimer.onTime}m</strong>, rests{" "}
                    <strong>{draftTimer.offTime}m</strong>.
                  </Typography>
                </Box>
              )}

              {/* Quick Presets */}
              <Box className="ct-preset-section">
                <Typography className="ct-section-label">Quick Presets</Typography>
                <Box className="ct-presets">
                  {TIMER_PRESETS.map((p) => {
                    const selected =
                      Number(draftTimer.onTime) === p.on &&
                      Number(draftTimer.offTime) === p.off;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        disabled={isSubmitting}
                        className={`ct-preset-pill ${selected ? "is-selected" : ""}`}
                        onClick={() => {
                          if (!isSubmitting) {
                            setDraftTimer((prev) => ({
                              ...prev,
                              onTime: p.on,
                              offTime: p.off,
                            }));
                          }
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}

          {/* Apply / Sync Footer */}
          {isDirty ? (
            <Box className="ct-footer-action">
              <Button
                variant="contained"
                color={draftTimer.enabled ? "primary" : "error"}
                fullWidth
                disabled={isSubmitting || !isValid}
                onClick={handleApplyTimer}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : draftTimer.enabled ? (
                    <PlayArrow />
                  ) : (
                    <PowerOff />
                  )
                }
              >
                {isSubmitting
                  ? "Syncing with Device..."
                  : draftTimer.enabled
                  ? "Apply Timer"
                  : "Turn Off Timer"}
              </Button>
              {!isValid && draftTimer.enabled && (
                <Typography variant="caption" color="error" className="ct-validation-msg">
                  Please enter at least 1 minute for both ON and OFF times.
                </Typography>
              )}
            </Box>
          ) : (
            <Box className="ct-synced-note">
              <CheckCircleOutline fontSize="small" />
              <span>Synced with device</span>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Redesigned Schedule Modal ───────────────────────────────────────── */}
      <Dialog
        open={schedOpen}
        onClose={() => setSchedOpen(false)}
        maxWidth="sm"
        fullWidth
        className="ct-modal-dialog"
      >
        <DialogTitle className="ct-dialog-title">
          <Box className="ct-title-left">
            <Box className="ct-title-icon">
              <ScheduleIcon />
            </Box>
            <Box className="ct-title-meta">
              <span className="ct-title-heading">Schedules</span>
              <Box className="ct-title-sub">
                <span>{control.name || control.pin}</span>
                <span className="ct-pin-badge">{control.pin}</span>
              </Box>
            </Box>
          </Box>
          <IconButton
            className="ct-dialog-close"
            onClick={() => setSchedOpen(false)}
            aria-label="Close"
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent className="ct-dialog-content">
          {/* Segmented Tab Switcher */}
          <Box className="ct-tabs">
            <button
              type="button"
              className={`ct-tab-btn ${schedTab === "list" ? "is-active" : ""}`}
              onClick={() => {
                setSchedError("");
                setSchedTab("list");
              }}
            >
              <span>My Schedules</span>
              <span className="ct-tab-count">{schedules.length}</span>
            </button>
            <button
              type="button"
              className={`ct-tab-btn ${schedTab === "create" ? "is-active" : ""}`}
              onClick={() => {
                setSchedError("");
                setSchedTab("create");
              }}
            >
              <Add fontSize="small" />
              <span>New Schedule</span>
            </button>
          </Box>

          {schedTab === "list" ? (
            /* ── Tab 1: Active Schedules List ────────────────────────────── */
            <Box className="ct-sched-list-view">
              {schedLoading ? (
                <Box className="ct-center">
                  <CircularProgress size={26} />
                </Box>
              ) : schedules.length === 0 ? (
                <Box className="ct-empty-state">
                  <Box className="ct-empty-icon">
                    <EventRepeat />
                  </Box>
                  <Typography className="ct-empty-title">No schedules yet</Typography>
                  <Typography className="ct-empty-desc">
                    Automate {control.name || control.pin} to turn ON or OFF at specific
                    times every day or on a single date.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => setSchedTab("create")}
                    className="ct-empty-cta"
                  >
                    Create First Schedule
                  </Button>
                </Box>
              ) : (
                <>
                  <Box className="ct-sched-list">
                    {schedules.map((s) => {
                      const isOnce = s.scheduleType === "once";
                      const isOnAction = s.action === "ON";
                      const startStr = formatTime12h(s.startTime || s.time);
                      const endStr = s.endTime ? formatTime12h(s.endTime) : null;
                      return (
                        <Box
                          key={s.id || s._id}
                          className={`ct-sched-card ${s.enabled ? "" : "is-paused"}`}
                        >
                          <Box className={`ct-action-pill ${isOnAction ? "is-on" : "is-off"}`}>
                            {isOnAction ? "ON" : "OFF"}
                          </Box>

                          <Box className="ct-sched-card-main">
                            <Box className="ct-sched-time-row">
                              <span className="ct-sched-time">{startStr}</span>
                              {endStr && (
                                <>
                                  <ArrowForward className="ct-time-arrow" />
                                  <span className="ct-sched-end">{endStr} OFF</span>
                                </>
                              )}
                            </Box>

                            <Box className="ct-sched-meta-row">
                              <span className="ct-sched-freq">
                                {formatFrequencyLabel(s)}
                              </span>
                              <Tooltip
                                title={
                                  isOnce
                                    ? "Runs once via cloud on the selected date"
                                    : "Stored on device — works even if internet drops"
                                }
                                arrow
                              >
                                <span
                                  className={`ct-mode-tag ${isOnce ? "is-cloud" : "is-hw"}`}
                                >
                                  {isOnce ? (
                                    <>
                                      <CloudQueue /> One-time
                                    </>
                                  ) : (
                                    <>
                                      <Memory /> Offline-ready
                                    </>
                                  )}
                                </span>
                              </Tooltip>
                            </Box>
                          </Box>

                          <Box className="ct-sched-controls">
                            <Tooltip title={s.enabled ? "Pause" : "Enable"}>
                              <Switch
                                size="small"
                                checked={Boolean(s.enabled)}
                                onChange={() => handleToggleSchedule(s)}
                              />
                            </Tooltip>
                            <Tooltip title="Delete schedule">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSchedule(s)}
                                aria-label="Delete schedule"
                                className="ct-delete-btn"
                              >
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Add />}
                    onClick={() => setSchedTab("create")}
                    className="ct-add-another-btn"
                  >
                    Add Another Schedule
                  </Button>
                </>
              )}
            </Box>
          ) : (
            /* ── Tab 2: Create New Schedule Form ─────────────────────────── */
            <Box className="ct-create-view">
              {/* Step 1: Action */}
              <Box className="ct-field-group">
                <Typography className="ct-section-label">1. Action</Typography>
                <Box className="ct-action-segmented">
                  <button
                    type="button"
                    className={`ct-seg-btn is-on ${schedAction === "ON" ? "is-active" : ""}`}
                    onClick={() => setSchedAction("ON")}
                  >
                    <PowerSettingsNew fontSize="small" />
                    <span>Turn ON</span>
                  </button>
                  <button
                    type="button"
                    className={`ct-seg-btn is-off ${schedAction === "OFF" ? "is-active" : ""}`}
                    onClick={() => setSchedAction("OFF")}
                  >
                    <PowerOff fontSize="small" />
                    <span>Turn OFF</span>
                  </button>
                </Box>
              </Box>

              {/* Step 2: Repeat Frequency */}
              <Box className="ct-field-group">
                <Typography className="ct-section-label">2. Repeat</Typography>
                <Box className="ct-repeat-pills">
                  {REPEAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`ct-repeat-pill ${
                        schedType === opt.value ? "is-selected" : ""
                      }`}
                      onClick={() => setSchedType(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </Box>

                {schedType === "once" && (
                  <Box sx={{ mt: 1.5 }}>
                    <TextField
                      type="date"
                      label="Select Date"
                      size="small"
                      fullWidth
                      value={schedDate}
                      onChange={(e) => setSchedDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: getTodayDateString() }}
                    />
                  </Box>
                )}

                {schedType === "weekly" && (
                  <Box className="ct-day-pills">
                    {DAY_SHORT.map((letter, idx) => {
                      const active = schedDays.includes(idx);
                      return (
                        <Tooltip key={DAY_LABELS[idx]} title={DAY_LABELS[idx]} arrow>
                          <button
                            type="button"
                            className={`ct-day-circle ${active ? "is-active" : ""}`}
                            onClick={() => toggleDay(idx)}
                            aria-label={DAY_LABELS[idx]}
                          >
                            {letter}
                          </button>
                        </Tooltip>
                      );
                    })}
                  </Box>
                )}
              </Box>

              {/* Step 3: Time */}
              <Box className="ct-field-group">
                <Typography className="ct-section-label">3. Time</Typography>
                <Box
                  className={`ct-time-grid ${schedAction === "OFF" ? "single-col" : ""}`}
                >
                  <TextField
                    type="time"
                    label={schedAction === "ON" ? "Start Time" : "Turn OFF At"}
                    size="small"
                    fullWidth
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  {schedAction === "ON" && (
                    <TextField
                      type="time"
                      label="Auto-OFF Time (Optional)"
                      size="small"
                      fullWidth
                      value={schedEndTime}
                      onChange={(e) => setSchedEndTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        endAdornment: schedEndTime ? (
                          <Tooltip title="Clear Auto-OFF time">
                            <IconButton size="small" onClick={() => setSchedEndTime("")}>
                              <Close fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null,
                      }}
                    />
                  )}
                </Box>
              </Box>

              {/* Live Plain-English Summary */}
              <Box className="ct-live-preview">
                <Box className="ct-preview-top">
                  <CalendarToday fontSize="small" />
                  <Typography className="ct-preview-text">{liveScheduleSummary}</Typography>
                </Box>
                <Typography className="ct-preview-hint">
                  {schedType === "once"
                    ? "Runs once on this date via cloud, then disables automatically."
                    : "Saved to your controller — runs on time even without internet."}
                </Typography>
              </Box>

              {/* Enable & Submit */}
              <Box className="ct-create-footer">
                <Box className="ct-enable-inline">
                  <Switch
                    size="small"
                    checked={schedEnabled}
                    onChange={(e) => setSchedEnabled(e.target.checked)}
                  />
                  <span>Activate immediately</span>
                </Box>

                {schedError && (
                  <Typography color="error" variant="body2" className="ct-error-box">
                    {schedError}
                  </Typography>
                )}

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={schedBusy ? null : <Add />}
                  onClick={handleCreateSchedule}
                  disabled={schedBusy}
                >
                  {schedBusy ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Save Schedule"
                  )}
                </Button>
              </Box>
            </Box>
          )}
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
