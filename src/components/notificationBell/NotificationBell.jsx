import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdNotificationsNone,
  MdCheck,
  MdDoneAll,
  MdError,
  MdWarning,
  MdInfo,
  MdOpenInNew,
  MdRefresh,
} from "react-icons/md";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api/fetchNotifications";
import "./NotificationBell.scss";

const POLL_MS = 30000; // refresh unread count while open on any page
const MAX_ITEMS = 20;

const SEVERITY_META = {
  critical: { icon: <MdError />, cls: "severity-critical", label: "Critical" },
  warning: { icon: <MdWarning />, cls: "severity-warning", label: "Warning" },
  info: { icon: <MdInfo />, cls: "severity-info", label: "Info" },
};

const severityMeta = (severity) => SEVERITY_META[severity] || SEVERITY_META.info;

const timeAgo = (iso) => {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef(null);
  const mountedRef = useRef(true);

  // Load the inbox (list + unread count) — silent, never throws to the UI.
  const load = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications({ limit: MAX_ITEMS });
      if (!mountedRef.current) return;
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setTotal(data.total || 0);
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Initial load + polling while mounted (badge stays fresh on every page).
  useEffect(() => {
    mountedRef.current = true;
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [load]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    if (!open) load(); // refresh when opening (kept outside the updater)
    setOpen(!open);
  };

  // Clicking a notification marks it read and opens the farm.
  const handleOpen = async (notification) => {
    if (!notification.read) {
      setBusy(true);
      try {
        await markNotificationRead(notification.id);
        if (!mountedRef.current) return;
        setItems((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Non-fatal — still navigate.
      } finally {
        if (mountedRef.current) setBusy(false);
      }
    }
    setOpen(false);
    if (notification.uid) {
      navigate(`/products/${notification.uid}/data`);
    } else {
      navigate("/notifications");
    }
  };

  const handleMarkAll = async () => {
    setBusy(true);
    try {
      await markAllNotificationsRead();
      if (!mountedRef.current) return;
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // keep local state; next poll reconciles
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/notifications");
  };

  return (
    <div className="notification-bell" ref={wrapRef}>
      <button
        type="button"
        className={`bell-btn ${open ? "bell-btn-open" : ""}`}
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <MdNotificationsNone size={24} />
        {unreadCount > 0 && (
          <span className="bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="bell-dropdown">
          <div className="bell-dropdown-header">
            <div>
              <h4>Notifications</h4>
              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread of ${total}`
                  : "You're all caught up"}
              </p>
            </div>
            <div className="bell-dropdown-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="bell-action-link"
                  onClick={handleMarkAll}
                  disabled={busy}
                >
                  <MdDoneAll /> Mark all read
                </button>
              )}
              <button
                type="button"
                className="bell-action-icon"
                onClick={load}
                title="Refresh"
                aria-label="Refresh notifications"
                disabled={loading}
              >
                <MdRefresh />
              </button>
            </div>
          </div>

          {error && <div className="bell-error">Couldn't load notifications</div>}

          <div className="bell-list">
            {items.length === 0 && !loading && !error && (
              <div className="bell-empty">
                <MdNotificationsNone size={32} />
                <p>No notifications yet</p>
              </div>
            )}
            {items.map((n) => {
              const meta = severityMeta(n.severity);
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`bell-item ${n.read ? "read" : "unread"}`}
                  onClick={() => handleOpen(n)}
                >
                  <span className={`bell-item-icon ${meta.cls}`}>{meta.icon}</span>
                  <span className="bell-item-body">
                    <span className="bell-item-title">
                      {n.title}
                      {n.uid && (
                        <span className="bell-item-uid" title={`Device ${n.uid}`}>
                          <MdOpenInNew /> {n.uid}
                        </span>
                      )}
                    </span>
                    <span className="bell-item-message">{n.body}</span>
                    <span className="bell-item-meta">
                      <span className="bell-item-time">{timeAgo(n.createdAt)}</span>
                      {!n.read && <span className="bell-item-unread-dot" />}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bell-dropdown-footer">
            <button type="button" className="bell-view-all" onClick={handleViewAll}>
              <MdCheck /> View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
