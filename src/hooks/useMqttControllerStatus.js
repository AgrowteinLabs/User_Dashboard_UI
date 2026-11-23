import { useEffect, useState, useRef, useCallback } from "react";
import mqtt from "mqtt";
import { v4 as uuidv4 } from "uuid";

const baseUrl = import.meta.env.VITE_REACT_APP_API_URL || "https://apiv2.agrowtein.com";
const SIGN_URL_API = `${baseUrl}/api/sign-mqtt-url`;
const URL_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

const normalizeKey = (key) => key?.toString().trim().toLowerCase() || "";

// Subscribe to control status messages on `esp32/{uid}/msg` and `esp32/{uid}/feed`
// Returns a map keyed by controlId or pin with { state, value, lastUpdated, raw }
export const useMqttControllerStatus = (uid, isBlocked = false) => {
  const [statusMap, setStatusMap] = useState({});
  const [connected, setConnected] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  const clientRef = useRef(null);
  const signedUrlTimeRef = useRef(0);
  const isConnectingRef = useRef(false);
  const refreshTimeoutRef = useRef(null);

  const setupMqtt = useCallback(async () => {
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

      if (res.status === 402) {
        console.warn(`[MQTT] Control status stream suspended for ${uid} (402)`);
        setIsSuspended(true);
        setConnected(false);
        setStatusMap({});
        isConnectingRef.current = false;
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!data || !data.url) {
        isConnectingRef.current = false;
        return;
      }

      setIsSuspended(false);
      signedUrlTimeRef.current = Date.now();

      const mqttClient = mqtt.connect(data.url, {
        clientId: `frontend-ctrl-${uuidv4()}`,
        protocol: "wss",
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 8000,
      });

      mqttClient.on("connect", () => {
        console.log("✅ MQTT control-status connected");
        setConnected(true);
        isConnectingRef.current = false;
        const topics = [`esp32/${uid}/msg`, `esp32/${uid}/feed`];
        mqttClient.subscribe(topics, (err) => {
          if (err) console.error("❌ Subscription failed:", err);
          else console.log(`📡 Status subscribed to: ${topics.join(", ")}`);
        });
      });

      mqttClient.on("message", (_topic, payload) => {
        try {
          const messageData = JSON.parse(payload.toString());
          const rawKey = messageData.controlId || messageData.pin || messageData.name;
          const key = normalizeKey(rawKey);
          if (!key) return;

          setStatusMap((prev) => ({
            ...prev,
            [key]: {
              state: messageData.state || messageData.status || "UNKNOWN",
              value: messageData.value ?? messageData.sensorValue,
              lastUpdated: messageData.timestamp || Date.now(),
              raw: messageData,
            },
          }));
        } catch (err) {
          console.error("❌ JSON parse error (control status):", err);
        }
      });

      const handleStaleConnection = () => {
        const isUrlExpired = Date.now() - signedUrlTimeRef.current > URL_MAX_AGE_MS;
        if (isUrlExpired) {
          console.warn("⚠️ MQTT control-status URL expired, requesting fresh signed URL...");
          if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = setTimeout(() => {
            refreshTimeoutRef.current = null;
            setupMqtt();
          }, 1500);
        }
      };

      mqttClient.on("error", (err) => {
        console.error("MQTT control-status error:", err);
        handleStaleConnection();
      });

      mqttClient.on("close", () => {
        console.warn("🚫 MQTT control-status connection closed");
        setConnected(false);
        handleStaleConnection();
      });

      clientRef.current = mqttClient;
    } catch (err) {
      console.error("❌ Error setting up MQTT control-status:", err);
      isConnectingRef.current = false;
    }
  }, [uid, isBlocked]);

  useEffect(() => {
    if (!uid || isBlocked) {
      if (isBlocked) setIsSuspended(true);
      setStatusMap({});
      setConnected(false);
      return;
    }

    setupMqtt();

    // Auto-heal on mobile wakeup / network reconnect
    const handleWakeup = () => {
      if (document.visibilityState === "hidden") return;
      const client = clientRef.current;
      const isUrlExpired = Date.now() - signedUrlTimeRef.current > URL_MAX_AGE_MS;
      if (!client?.connected || isUrlExpired) {
        console.log("🔄 App woke from idle: auto-renewing MQTT control-status signed URL");
        setupMqtt();
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
      clientRef.current?.end(true);
    };
  }, [uid, isBlocked, setupMqtt]);

  return { statusMap, connected, isSuspended };
};
