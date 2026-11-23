import { useEffect, useState, useRef, useCallback } from "react";
import mqtt from "mqtt";
import { v4 as uuidv4 } from "uuid";

const baseUrl = import.meta.env.VITE_REACT_APP_API_URL || "https://apiv2.agrowtein.com";
const SIGN_URL_API = `${baseUrl}/api/sign-mqtt-url`;
const URL_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

// Helper to determine if there is a significant (>= 1.0 point) difference
const hasSignificantChange = (oldData, newData) => {
  if (!oldData) return true;

  for (const key in newData) {
    if (Object.prototype.hasOwnProperty.call(newData, key)) {
      const valOld = oldData[key];
      const valNew = newData[key];

      if (valOld === undefined) {
        return true; // new sensor added
      }

      const numOld = Number(valOld);
      const numNew = Number(valNew);

      if (!isNaN(numOld) && !isNaN(numNew)) {
        // Both are numbers, check if absolute difference is >= 1.0
        if (Math.abs(numNew - numOld) >= 1.0) {
          return true;
        }
      } else {
        // For non-numeric values, update on any change
        if (valOld !== valNew) {
          return true;
        }
      }
    }
  }

  return false;
};

export const useMqttSensorData = (uid, isBlocked = false) => {
  const [message, setMessage] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastReceivedTime, setLastReceivedTime] = useState(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState(null);
  const [holdType, setHoldType] = useState("PAYMENT");

  const clientRef = useRef(null);
  const signedUrlTimeRef = useRef(0);
  const isConnectingRef = useRef(false);
  const refreshTimeoutRef = useRef(null);

  const throttleTimerRef = useRef(null);
  const pendingDataRef = useRef(null);
  const lastAcceptedDataRef = useRef(null);
  const isFirstMessageRef = useRef(true);
  const lastTimestampRef = useRef(0);

  const setupSensorMqtt = useCallback(async () => {
    if (!uid || isBlocked) return;
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    // Clean up any stale client
    if (clientRef.current) {
      try {
        clientRef.current.end(true);
      } catch (_e) {
        /* ignore */
      }
      clientRef.current = null;
    }

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${SIGN_URL_API}?uid=${uid}`, {
        headers,
        credentials: "include",
      });

      // 402: Device is suspended / billing hold
      if (res.status === 402) {
        const errData = await res.json().catch(() => ({}));
        console.warn(`[MQTT] Real-time sensor access suspended for ${uid}:`, errData);
        setIsSuspended(true);
        setSuspensionReason(errData?.error?.message || errData?.message || "Data display suspended.");
        setHoldType(errData?.error?.holdType || errData?.data?.holdType || "PAYMENT");
        setConnected(false);
        setMessage(null);
        isConnectingRef.current = false;
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!data || !data.url) {
        isConnectingRef.current = false;
        return;
      }

      setIsSuspended(false);
      setSuspensionReason(null);
      signedUrlTimeRef.current = Date.now();

      const mqttClient = mqtt.connect(data.url, {
        clientId: `frontend-${uuidv4()}`,
        protocol: "wss",
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 8000,
      });

      mqttClient.on("connect", () => {
        console.log("✅ MQTT sensor connected");
        setConnected(true);
        isConnectingRef.current = false;

        mqttClient.subscribe(`esp32/${uid}/pub`, (err) => {
          if (err) console.error("❌ Subscription failed:", err);
        });
      });

      const handleMqttMessage = (payload) => {
        try {
          const parsed = JSON.parse(payload.toString());
          const now = Date.now();

          // 1. Keep the device's online status active: update lastReceivedTime 
          // at most once every 15 seconds to prevent stale timeouts without lagging scroll.
          if (now - lastTimestampRef.current > 15000) {
            setLastReceivedTime(now);
            lastTimestampRef.current = now;
          }

          // 2. Check if the readings have a significant change (>= 1.0 point difference)
          // compared to what is currently displayed on the UI.
          if (!hasSignificantChange(lastAcceptedDataRef.current, parsed)) {
            return;
          }

          pendingDataRef.current = parsed;

          // Show first message immediately so the dashboard doesn't feel blank on load
          if (isFirstMessageRef.current) {
            setMessage(parsed);
            lastAcceptedDataRef.current = parsed;
            setLastReceivedTime(now);
            lastTimestampRef.current = now;
            isFirstMessageRef.current = false;
            pendingDataRef.current = null;
            return;
          }

          // Throttle subsequent state updates to once every 800ms
          if (!throttleTimerRef.current) {
            throttleTimerRef.current = setTimeout(() => {
              if (pendingDataRef.current) {
                setMessage(pendingDataRef.current);
                lastAcceptedDataRef.current = pendingDataRef.current;
                setLastReceivedTime(Date.now());
                lastTimestampRef.current = Date.now();
                pendingDataRef.current = null;
              }
              throttleTimerRef.current = null;
            }, 800);
          }
        } catch (err) {
          console.error("❌ JSON parse error:", err);
        }
      };

      mqttClient.on("message", (_topic, payload) => {
        handleMqttMessage(payload);
      });

      const handleStaleConnection = () => {
        const isUrlExpired = Date.now() - signedUrlTimeRef.current > URL_MAX_AGE_MS;
        if (isUrlExpired) {
          console.warn("⚠️ MQTT sensor URL expired, requesting fresh signed URL...");
          if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = setTimeout(() => {
            refreshTimeoutRef.current = null;
            setupSensorMqtt();
          }, 1500);
        }
      };

      mqttClient.on("error", (err) => {
        console.error("MQTT sensor error:", err);
        handleStaleConnection();
      });

      mqttClient.on("close", () => {
        console.warn("🚫 MQTT sensor connection closed");
        setConnected(false);
        handleStaleConnection();
      });

      clientRef.current = mqttClient;
    } catch (err) {
      console.error("❌ Error setting up MQTT sensor:", err);
      isConnectingRef.current = false;
    }
  }, [uid, isBlocked]);

  useEffect(() => {
    if (!uid || isBlocked) {
      if (isBlocked) setIsSuspended(true);
      setMessage(null);
      setConnected(false);
      return;
    }

    isFirstMessageRef.current = true;
    lastAcceptedDataRef.current = null;
    lastTimestampRef.current = 0;

    setupSensorMqtt();

    // Auto-heal on mobile wakeup / network reconnect
    const handleWakeup = () => {
      if (document.visibilityState === "hidden") return;
      const client = clientRef.current;
      const isUrlExpired = Date.now() - signedUrlTimeRef.current > URL_MAX_AGE_MS;
      if (!client?.connected || isUrlExpired) {
        console.log("🔄 App woke from idle: auto-renewing MQTT sensor signed URL");
        setupSensorMqtt();
      }
    };

    window.addEventListener("online", handleWakeup);
    window.addEventListener("focus", handleWakeup);
    document.addEventListener("visibilitychange", handleWakeup);

    return () => {
      window.removeEventListener("online", handleWakeup);
      window.removeEventListener("focus", handleWakeup);
      document.removeEventListener("visibilitychange", handleWakeup);
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      clientRef.current?.end(true);
    };
  }, [uid, isBlocked, setupSensorMqtt]);

  return { message, connected, lastReceivedTime, isSuspended, suspensionReason, holdType };
};
