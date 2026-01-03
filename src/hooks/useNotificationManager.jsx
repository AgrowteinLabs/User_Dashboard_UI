import PropTypes from "prop-types";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const NotificationContext = createContext(null);

const useNotificationState = () => {
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);

    const addNotification = useCallback((notification) => {
        setNotifications((prev) => [{ id: Date.now(), ...notification, read: false }, ...prev]);
        setUnread((prev) => prev + 1);
    }, []);

    const notifyPasswordChange = useCallback(() => {
        addNotification({ type: "success", message: "Password changed successfully.", time: new Date().toLocaleString() });
    }, [addNotification]);

    const markAsRead = useCallback((id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnread((prev) => Math.max(0, prev - 1));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnread(0);
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnread(0);
    }, []);

    return { notifications, unread, addNotification, pushNotification: addNotification, notifyPasswordChange, markAsRead, markAllAsRead, clearAll };
};

export const NotificationProvider = ({ children }) => {
    const state = useNotificationState();

    const value = useMemo(() => ({ ...state }), [state.notifications, state.unread, state.addNotification, state.notifyPasswordChange, state.markAsRead, state.markAllAsRead, state.clearAll, state.pushNotification]);

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

NotificationProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useNotificationManager = ({ currentData } = {}) => {
    const contextValue = useContext(NotificationContext);
    const fallbackValue = useNotificationState();
    const manager = contextValue || fallbackValue;
    const { addNotification } = manager;
    const lastErrorsRef = useRef({});

    useEffect(() => {
        if (!currentData || !currentData.data) return;

        Object.entries(currentData.data).forEach(([key, val]) => {
            const value = val?.value;
            if (typeof value === "string" && value.includes("-er")) {
                if (!lastErrorsRef.current[key]) {
                    addNotification({ type: "error", message: `Sensor "${key}" reported an error.`, time: new Date().toLocaleString() });
                    lastErrorsRef.current[key] = true;
                }
            } else {
                lastErrorsRef.current[key] = false;
            }
        });
    }, [addNotification, currentData]);

    return manager;
};