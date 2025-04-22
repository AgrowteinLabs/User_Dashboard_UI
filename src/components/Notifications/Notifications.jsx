import { useNotificationManager } from "../../hooks/useNotificationManager";
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
