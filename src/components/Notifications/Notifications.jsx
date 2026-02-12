import { useContext, useEffect, useState, useCallback } from "react";
import { useNotificationManager } from "../../hooks/useNotificationManager";
import { UserContext } from "../../context/UserContext";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { MdCheckCircle, MdError, MdInfo } from "react-icons/md";
import "./Notifications.scss";

const getIcon = (type) => {
  switch (type) {
    case "success": return <MdCheckCircle />;
    case "error": return <MdError />;
    case "info":
    default: return <MdInfo />;
  }
};

const Notifications = () => {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    // unread,
  } = useNotificationManager(); // No need to pass anything

  const { user } = useContext(UserContext);
  const { checkSubscriptionStatus, ensureSubscription, isPushSupported } = usePushNotifications();
  const [pushStatus, setPushStatus] = useState(null);
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
    if (!userId) return alert("User ID not found in context or local storage");
    const result = await ensureSubscription({ vapidKey, userId });
    alert(JSON.stringify(result));
    checkStatus();
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <p>Stay updated with system alerts and activity logs.</p>

        <div className="notification-actions">
          {notifications.length > 0 && (
            <>
              <button onClick={markAllAsRead}>Mark All as Read</button>
              <button onClick={clearAll}>Clear All</button>
            </>
          )}
        </div>
      </div>

      {/* Debug UI for Production */}
      <div className="push-debug-section" style={{ padding: "10px", margin: "10px 0", background: "#f5f5f5", borderRadius: "5px", fontSize: "12px", color: "#333" }}>
        <h3>Push Notification Status (Debug)</h3>
        <p><strong>Supported:</strong> {isPushSupported() ? "Yes" : "No"}</p>
        <p><strong>VAPID Key:</strong> {vapidKey ? "Present" : "Missing"}</p>
        <p><strong>User ID:</strong> {user?._id || localStorage.getItem("userId") || "Missing"}</p>
        <p><strong>Permission:</strong> {pushStatus?.permission || "Unknown"}</p>
        <p><strong>Subscription:</strong> {pushStatus?.status || "Unknown"}</p>
        <button onClick={handleSubscribe} style={{ marginTop: "5px", padding: "5px 10px" }}>
          Retry Subscription
        </button>
        <button onClick={checkStatus} style={{ marginTop: "5px", marginLeft: "5px", padding: "5px 10px" }}>
          Refresh Status
        </button>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <MdCheckCircle className="empty-icon" />
            <p>🎉 You&#39;re all caught up!</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card ${notification.read ? "read" : "unread"}`}
            >
              <div className="notification-icon">{getIcon(notification.type)}</div>
              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                <p className="notification-time">{notification.time}</p>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="mark-as-read-btn"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
              {!notification.read && <div className="notification-badge">New</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
