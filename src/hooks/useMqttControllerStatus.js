import { useEffect, useState } from "react";
import mqtt from "mqtt";
import { v4 as uuidv4 } from "uuid";

const baseUrl = import.meta.env.VITE_REACT_APP_API_URL || "https://apiv2.agrowtein.com";
const SIGN_URL_API = `${baseUrl}/api/sign-mqtt-url`;

const normalizeKey = (key) => key?.toString().trim().toLowerCase() || "";

// Subscribe to control status messages on `esp32/{uid}/msg`
// Returns a map keyed by controlId or pin with { state, value, lastUpdated, raw }
export const useMqttControllerStatus = (uid, isBlocked = false) => {
  const [statusMap, setStatusMap] = useState({});
  const [connected, setConnected] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    if (!uid || isBlocked) {
      if (isBlocked) setIsSuspended(true);
      setStatusMap({});
      setConnected(false);
      return;
    }

    let client;

    const setupMqtt = async () => {
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
          return;
        }

        const data = await res.json().catch(() => ({}));
        if (!data || !data.url) return;

        setIsSuspended(false);

        client = mqtt.connect(data.url, {
          clientId: `frontend-ctrl-${uuidv4()}`,
          protocol: "wss",
          clean: true,
          reconnectPeriod: 5000,
          connectTimeout: 8000,
        });

        client.on("connect", () => {
          console.log("✅ MQTT control-status connected");
          setConnected(true);
          client.subscribe(`esp32/${uid}/msg`, (err) => {
            if (err) console.error("❌ Subscription failed:", err);
          });
        });

        client.on("message", (_topic, payload) => {
          try {
            const data = JSON.parse(payload.toString());
            console.log("📥 Control status MQTT", data);
            const rawKey = data.controlId || data.pin || data.name;
            const key = normalizeKey(rawKey);
            if (!key) return;

            setStatusMap((prev) => ({
              ...prev,
              [key]: {
                state: data.state || data.status || "UNKNOWN",
                value: data.value ?? data.sensorValue,
                lastUpdated: data.timestamp || Date.now(),
                raw: data,
              },
            }));
          } catch (err) {
            console.error("❌ JSON parse error (control status):", err);
          }
        });

        client.on("error", (err) => console.error("MQTT error:", err));
        client.on("close", () => {
          console.warn("🚫 MQTT control-status connection closed");
          setConnected(false);
        });
      } catch (err) {
        console.error("❌ Error setting up MQTT control-status:", err);
      }
    };

    setupMqtt();
    return () => client?.end();
  }, [uid, isBlocked]);

  return { statusMap, connected, isSuspended };
};
