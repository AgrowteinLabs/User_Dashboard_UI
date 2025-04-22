import { useEffect, useRef, useState } from "react";

export const useNotificationManager = ({ currentData } = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const lastErrorsRef = useRef({});

  const addNotification = (notification) => {
    setNotifications((prev) => [
      {
        id: Date.now(),
        ...notification,
        read: false,
      },
      ...prev,
    ]);
    setUnread((prev) => prev + 1);
  };

  // ✅ Password-specific call
  const notifyPasswordChange = () => {
    addNotification({
      type: "success",
      message: "Password changed successfully.",
      time: new Date().toLocaleString(),
    });
  };

  // ✅ Error sensor watcher
  useEffect(() => {
    if (!currentData || !currentData.data) return;

    Object.entries(currentData.data).forEach(([key, val]) => {
      const value = val?.value;
      if (typeof value === "string" && value.includes("-er")) {
        if (!lastErrorsRef.current[key]) {
          addNotification({
            type: "error",
            message: `Sensor "${key}" reported an error.`,
            time: new Date().toLocaleString(),
          });
          lastErrorsRef.current[key] = true;
        }
      } else {
        lastErrorsRef.current[key] = false;
      }
    });
  }, [currentData]);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnread((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnread(0);
  };

  return {
    notifications,
    unread,
    addNotification,
    notifyPasswordChange,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
};
