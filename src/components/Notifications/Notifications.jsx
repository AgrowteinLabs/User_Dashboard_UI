import React, { useState, useEffect } from "react";
import { MdCheckCircle, MdError, MdInfo } from "react-icons/md";
import "./Notifications.scss";

const mockNotifications = [
  {
    id: 2,
    type: "success",
    message: "Password Updated.",
    time: "03/10/2024 - 2:33 PM",
    read: false,
  },
  {
    id: 3,
    type: "success",
    message: "Profile Updated.",
    time: "03/10/2024 - 2:30 PM",
    read: true,
  },
  {
    id: 4,
    type: "success",
    message: "Account Created Successfully.",
    time: "02/10/2024 - 4:30 PM",
    read: true,
  },
];

const getIcon = (type) => {
  switch (type) {
    case "success":
      return <MdCheckCircle />;
    case "error":
      return <MdError />;
    case "info":
    default:
      return <MdInfo />;
  }
};

const Notifications = () => {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : mockNotifications; // Load from localStorage or fallback to mock data
  });

  const markAsRead = (id) => {
    // Update the notification state locally to hide red dot and button
    const updatedNotifications = notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification
    );
    setNotifications(updatedNotifications);

    // Optionally save to localStorage to persist across refreshes (for demo purposes)
    localStorage.setItem("notifications", JSON.stringify(mockNotifications)); // Reset notifications on refresh
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <p>Stay updated with the latest notifications.</p>
      </div>
      <div className="notifications-list">
        {notifications.map((notification) => (
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
        ))}
      </div>
    </div>
  );
};

export default Notifications;
