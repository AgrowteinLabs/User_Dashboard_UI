import { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useNotificationManager } from "../../hooks/useNotificationManager";
import { UserContext } from "../../context/UserContext";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import {
  MdCheckCircle,
  MdError,
  MdWarning,
  MdInfo,
  MdDoneAll,
  MdDeleteSweep,
  MdTune,
  MdNotificationsActive,
  MdNotificationsNone,
  MdCheck,
} from "react-icons/md";
import Swal from "sweetalert2";
import "./Notifications.scss";

const getIcon = (type) => {
  switch (type) {
    case "success":
      return <MdCheckCircle />;
    case "error":
      return <MdError />;
    case "warning":
    case "warn":
      return <MdWarning />;
    case "info":
    default:
      return <MdInfo />;
  }
};

const getTypeName = (type) => {
  switch (type) {
    case "success":
      return "Success";
    case "error":
      return "Alert";
    case "warning":
    case "warn":
      return "Warning";
    case "info":
    default:
      return "System";
  }
};

const Notifications = () => {
  const { notifications, markAsRead, markAllAsRead, clearAll, unread } =
    useNotificationManager();

  const { user } = useContext(UserContext);
  const { checkSubscriptionStatus, ensureSubscription, isPushSupported } =
    usePushNotifications();
  const [pushStatus, setPushStatus] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  const checkStatus = useCallback(async () => {
    const status = await checkSubscriptionStatus();
    setPushStatus(status);
  }, [checkSubscriptionStatus]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleSubscribe = async () => {
    const userId = user?._id || localStorage.getItem("userId");
    if (!userId) {
      return Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "User ID not found. Please log in again.",
        confirmButtonColor: "#00b880",
      });
    }

    try {
      const result = await ensureSubscription({ vapidKey, userId });

      if (result.permission === "denied") {
        Swal.fire({
          icon: "warning",
          title: "Permission Blocked",
          html: `
            <div style="text-align:left; font-size: 0.95rem; line-height: 1.6;">
              <p>Notifications are currently <strong>blocked</strong> by your browser.</p>
              <p><strong>To enable:</strong></p>
              <ol style="padding-left: 20px; margin-top: 8px;">
                <li>Click the <strong>settings/lock icon</strong> (🔒 or 🎛️) in your browser address bar (next to <code>localhost:5173</code>).</li>
                <li>Set <strong>Notifications</strong> to <strong>Allow</strong>.</li>
                <li>Click <strong>Sync Device Subscription</strong> again.</li>
              </ol>
            </div>
          `,
          confirmButtonText: "Got it",
          confirmButtonColor: "#00b880",
        });
      } else if (result.subscription) {
        Swal.fire({
          icon: "success",
          title: "Device Subscribed!",
          text: "Your device is now registered to receive real-time alerts.",
          confirmButtonColor: "#00b880",
        });
      } else if (result.error) {
        Swal.fire({
          icon: "error",
          title: "Subscription Failed",
          text: result.error,
          confirmButtonColor: "#00b880",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to subscribe device.",
        confirmButtonColor: "#00b880",
      });
    }

    checkStatus();
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter((n) => !n.read);
    }
    if (activeFilter === "alerts") {
      return notifications.filter(
        (n) => n.type === "error" || n.type === "warning" || n.type === "warn"
      );
    }
    if (activeFilter === "success") {
      return notifications.filter((n) => n.type === "success");
    }
    return notifications;
  }, [notifications, activeFilter]);

  const alertCount = useMemo(
    () =>
      notifications.filter(
        (n) => n.type === "error" || n.type === "warning" || n.type === "warn"
      ).length,
    [notifications]
  );

  return (
    <div className="notifications-page">
      {/* ── Hero Header ─────────────────────────────── */}
      <div className="notifications-hero">
        <div className="hero-top">
          <div className="hero-title-area">
            <h1 className="hero-title">Notifications</h1>
            <p className="hero-subtitle">
              Stay updated with real-time sensor alerts, controller events, and farm updates.
            </p>
          </div>

          <div className="hero-actions">
            {notifications.length > 0 && (
              <>
                <button
                  className="action-btn btn-read-all"
                  onClick={markAllAsRead}
                  title="Mark all notifications as read"
                >
                  <MdDoneAll /> Mark all as read
                </button>
                <button
                  className="action-btn btn-clear"
                  onClick={clearAll}
                  title="Clear all notifications"
                >
                  <MdDeleteSweep /> Clear all
                </button>
              </>
            )}
            <button
              className="action-btn btn-debug-toggle"
              onClick={() => setShowDiagnostics((prev) => !prev)}
              title="Toggle Push Notification Diagnostics"
            >
              <MdTune /> {showDiagnostics ? "Hide Setup" : "Push Setup"}
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="filter-pills">
          <button
            className={`filter-pill ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All
            <span className="pill-count">{notifications.length}</span>
          </button>
          <button
            className={`filter-pill ${activeFilter === "unread" ? "active" : ""}`}
            onClick={() => setActiveFilter("unread")}
          >
            Unread
            <span className="pill-count">{unread || 0}</span>
          </button>
          <button
            className={`filter-pill ${activeFilter === "alerts" ? "active" : ""}`}
            onClick={() => setActiveFilter("alerts")}
          >
            Alerts
            <span className="pill-count">{alertCount}</span>
          </button>
          <button
            className={`filter-pill ${activeFilter === "success" ? "active" : ""}`}
            onClick={() => setActiveFilter("success")}
          >
            Success
            <span className="pill-count">
              {notifications.filter((n) => n.type === "success").length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Push Notification Diagnostics Drawer ───── */}
      {showDiagnostics && (
        <div className="push-diagnostics-panel">
          <div className="diagnostics-header">
            <h3>
              <MdNotificationsActive /> Push Notification Service Diagnostics
            </h3>
          </div>

          <div className="diagnostics-grid">
            <div className="diag-item">
              <div className="diag-label">Push API Support</div>
              <div
                className={`diag-value ${
                  isPushSupported() ? "status-active" : "status-warn"
                }`}
              >
                {isPushSupported() ? "Supported" : "Not Supported"}
              </div>
            </div>

            <div className="diag-item">
              <div className="diag-label">VAPID Key</div>
              <div
                className={`diag-value ${
                  vapidKey ? "status-active" : "status-warn"
                }`}
              >
                {vapidKey ? "Configured" : "Missing"}
              </div>
            </div>

            <div className="diag-item">
              <div className="diag-label">Browser Permission</div>
              <div
                className={`diag-value ${
                  pushStatus?.permission === "granted"
                    ? "status-active"
                    : "status-warn"
                }`}
              >
                {pushStatus?.permission || "Default"}
              </div>
            </div>

            <div className="diag-item">
              <div className="diag-label">Device Subscription</div>
              <div className="diag-value">
                {pushStatus?.status || "Idle"}
              </div>
            </div>
          </div>

          <div className="diagnostics-buttons">
            <button className="diag-btn-primary" onClick={handleSubscribe}>
              Sync Device Subscription
            </button>
            <button className="diag-btn-secondary" onClick={checkStatus}>
              Refresh Status
            </button>
          </div>
        </div>
      )}

      {/* ── Notification Feed ──────────────────────── */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <MdNotificationsNone />
            </div>
            <h3>All Caught Up!</h3>
            <p>
              {activeFilter === "unread"
                ? "You have no unread notifications right now."
                : activeFilter === "alerts"
                ? "No active alerts or sensor warnings."
                : "No notifications to display at the moment."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const cardType = notification.type || "info";
            return (
              <div
                key={notification.id}
                className={`notification-card type-${cardType} ${
                  notification.read ? "read" : "unread"
                }`}
              >
                <div className="notification-icon-wrap">
                  {getIcon(notification.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-meta-top">
                    <span className="notification-type-tag">
                      {getTypeName(notification.type)}
                    </span>
                    <span className="notification-time">{notification.time}</span>
                  </div>

                  <p className="notification-message">{notification.message}</p>

                  {!notification.read && (
                    <div className="notification-card-actions">
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="mark-as-read-btn"
                        title="Mark this notification as read"
                      >
                        <MdCheck /> Mark as read
                      </button>
                    </div>
                  )}
                </div>

                {!notification.read && (
                  <div className="notification-badge">
                    <span className="badge-dot" />
                    New
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
