import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import {
  CircularProgress,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  AccessTime as TimeoutIcon,
  Terminal as TerminalIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./CommandHistoryPanel.scss";

dayjs.extend(relativeTime);

const normalizeKey = (key) => key?.toString().trim().toLowerCase() || "";

const STATUS_META = {
  completed: { label: "Completed", cls: "completed", icon: <SuccessIcon fontSize="inherit" /> },
  acknowledged: { label: "Acknowledged", cls: "completed", icon: <SuccessIcon fontSize="inherit" /> },
  failed: { label: "Failed", cls: "failed", icon: <ErrorIcon fontSize="inherit" /> },
  timeout: { label: "Timeout", cls: "timeout", icon: <TimeoutIcon fontSize="inherit" /> },
  pending: { label: "Pending", cls: "pending", icon: <PendingIcon fontSize="inherit" /> },
  queued: { label: "Queued", cls: "pending", icon: <PendingIcon fontSize="inherit" /> },
  executing: { label: "Executing", cls: "pending", icon: <PendingIcon fontSize="inherit" /> },
};

const StatusBadge = ({ status }) => {
  const norm = String(status || "").toLowerCase();
  const meta = STATUS_META[norm] || {
    label: status || "Unknown",
    cls: "pending",
    icon: <PendingIcon fontSize="inherit" />,
  };
  return (
    <span className={`cmd-status-badge ${meta.cls}`}>
      {meta.icon}
      <span>{meta.label}</span>
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string,
};

const commandLabel = (h) => {
  const cmd = h.command || h.action || "";
  const val = h.value !== undefined && h.value !== null ? ` ${h.value}` : "";
  return `${cmd}${val}`.trim() || "Command";
};

const CommandHistoryPanel = ({ productId, controls = [] }) => {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const seqRef = useRef(0);

  const fetchHistory = useCallback(async ({ silent = false } = {}) => {
    if (!productId) return;
    const seq = ++seqRef.current;
    if (!silent) setLoading(true);
    setError(null);

    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(
        `${url}/api/v1/products/${productId}/control-history?limit=100`,
        { credentials: "include" }
      );

      if (!res.ok) {
        if (res.status === 404) {
          if (seq === seqRef.current) {
            setHistory([]);
            setTotal(0);
            setRefreshedAt(new Date());
          }
          return;
        }
        throw new Error(`HTTP error ${res.status}`);
      }

      const body = await res.json().catch(() => ({}));
      const data = body?.data;

      if (seq === seqRef.current) {
        const list = Array.isArray(data?.history)
          ? data.history
          : Array.isArray(data)
          ? data
          : [];
        setHistory(list);
        setTotal(data?.total ?? list.length);
        setRefreshedAt(new Date());
      }
    } catch (err) {
      console.warn("Could not fetch command history:", err.message);
      if (seq === seqRef.current) {
        setError(err.message || "Failed to load command history.");
      }
    } finally {
      if (!silent && seq === seqRef.current) setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      // Find matching control name
      const ctrl = controls.find(
        (c) =>
          (h.controlId && normalizeKey(c.controlId) === normalizeKey(h.controlId)) ||
          (h.pin && normalizeKey(c.pin) === normalizeKey(h.pin))
      );
      const ctrlName = ctrl?.name || h.controlId || h.pin || "Controller";
      const cmdText = commandLabel(h);
      const query = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !query ||
        ctrlName.toLowerCase().includes(query) ||
        cmdText.toLowerCase().includes(query) ||
        String(h.pin || "").toLowerCase().includes(query);

      const statusNorm = String(h.status || "").toLowerCase();
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && (statusNorm === "completed" || statusNorm === "acknowledged")) ||
        (statusFilter === "failed" && statusNorm === "failed") ||
        (statusFilter === "timeout" && statusNorm === "timeout") ||
        (statusFilter === "pending" && (statusNorm === "pending" || statusNorm === "queued" || statusNorm === "executing"));

      return matchesSearch && matchesStatus;
    });
  }, [history, controls, searchTerm, statusFilter]);

  return (
    <div className="command-history-panel">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="ch-panel-header">
        <div className="ch-title-wrap">
          <div className="ch-title-icon">
            <TerminalIcon />
          </div>
          <div>
            <h3>Controller Command History</h3>
            <p>
              {total} command{total !== 1 ? "s" : ""} recorded
              {refreshedAt ? ` · refreshed ${dayjs(refreshedAt).fromNow()}` : ""}
            </p>
          </div>
        </div>

        <Button
          className="ch-refresh-btn"
          startIcon={<RefreshIcon />}
          onClick={() => fetchHistory()}
          disabled={loading}
          variant="outlined"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="ch-filters">
        <TextField
          size="small"
          placeholder="Filter by control, action, pin…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ch-search-field"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "var(--text-muted)" }} />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" className="ch-status-select">
          <InputLabel id="cmd-status-filter-label">Status</InputLabel>
          <Select
            labelId="cmd-status-filter-label"
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="completed">Completed / Ack</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="timeout">Timeout</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </Select>
        </FormControl>
      </div>

      {/* ── List / Content ─────────────────────────────────── */}
      {loading ? (
        <div className="ch-loading">
          <CircularProgress sx={{ color: "var(--primary-color)" }} />
          <span>Loading command history…</span>
        </div>
      ) : error ? (
        <div className="ch-empty ch-error">
          <span className="empty-icon">⚠️</span>
          <p>{error}</p>
          <Button variant="outlined" size="small" onClick={() => fetchHistory()}>
            Retry
          </Button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="ch-empty">
          <span className="empty-icon">📜</span>
          <p>
            {history.length === 0
              ? "No commands recorded for this device yet."
              : "No commands match your filter."}
          </p>
        </div>
      ) : (
        <div className="ch-list">
          {filteredHistory.map((h) => {
            const ctrl = controls.find(
              (c) =>
                (h.controlId && normalizeKey(c.controlId) === normalizeKey(h.controlId)) ||
                (h.pin && normalizeKey(c.pin) === normalizeKey(h.pin))
            );
            const ctrlName = ctrl?.name || h.controlId || h.pin || "Controller";
            const pinBadge = h.pin || ctrl?.pin || null;
            const hasFeedback =
              h.deviceFeedback?.received && Number.isFinite(h.deviceFeedback?.responseTime);

            return (
              <div key={h.id || h._id || `${h.timestamp}-${h.pin}`} className="ch-item">
                <div className="ch-item-left">
                  <div className="ch-item-target">
                    <span className="ch-ctrl-name">{ctrlName}</span>
                    {pinBadge && <span className="ch-pin-badge">{pinBadge}</span>}
                  </div>
                  <div className="ch-item-action" title={commandLabel(h)}>
                    <code>{commandLabel(h)}</code>
                  </div>
                </div>

                <div className="ch-item-right">
                  <StatusBadge status={h.status} />

                  <div className="ch-meta-wrap">
                    <span className="ch-time" title={dayjs(h.timestamp).format("YYYY-MM-DD HH:mm:ss")}>
                      {dayjs(h.timestamp).format("MMM D, YYYY h:mm A")}
                    </span>

                    {hasFeedback && (
                      <span className="ch-ack-badge">
                        acked in {(h.deviceFeedback.responseTime / 1000).toFixed(2)}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

CommandHistoryPanel.propTypes = {
  productId: PropTypes.string,
  controls: PropTypes.array,
};

export default CommandHistoryPanel;
