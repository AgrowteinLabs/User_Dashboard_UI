import { useEffect, useState } from "react";
import mqtt from "mqtt";
import { v4 as uuidv4 } from "uuid";

const SIGN_URL_API = `${import.meta.env.VITE_REACT_APP_API_URL}/api/sign-mqtt-url`;

const normalizeKey = (key) => key?.toString().trim().toLowerCase() || "";

// Subscribe to control status messages on `esp32/{uid}/msg`
// Returns a map keyed by controlId or pin with { state, value, lastUpdated, raw }
export const useMqttControllerStatus = (uid) => {
  const [statusMap, setStatusMap] = useState({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!uid) return;

    let client;

    const setupMqtt = async () => {
      try {
        const res = await fetch(`${SIGN_URL_API}?uid=${uid}`, { credentials: "include" });
        const { url } = await res.json();

        client = mqtt.connect(url, {
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
  }, [uid]);

  return { statusMap, connected };
};
