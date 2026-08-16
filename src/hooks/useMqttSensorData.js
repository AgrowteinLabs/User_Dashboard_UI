import { useEffect, useState, useRef } from "react";
import mqtt from "mqtt";
import { v4 as uuidv4 } from "uuid";

const SIGN_URL_API = `${import.meta.env.VITE_REACT_APP_API_URL}/api/sign-mqtt-url`;

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

export const useMqttSensorData = (uid) => {
  const [message, setMessage] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastReceivedTime, setLastReceivedTime] = useState(null);

  const throttleTimerRef = useRef(null);
  const pendingDataRef = useRef(null);
  const lastAcceptedDataRef = useRef(null);
  const isFirstMessageRef = useRef(true);
  const lastTimestampRef = useRef(0);

  useEffect(() => {
    if (!uid) return;

    let client;
    isFirstMessageRef.current = true;
    lastAcceptedDataRef.current = null;
    lastTimestampRef.current = 0;

    const setupSensorMqtt = async () => {
      try {
        const res = await fetch(`${SIGN_URL_API}?uid=${uid}`, { credentials: "include" });
        const { url } = await res.json();

        client = mqtt.connect(url, {
          clientId: `frontend-${uuidv4()}`,
          protocol: "wss",
          clean: true,
          reconnectPeriod: 5000,
          connectTimeout: 8000,
        });

        client.on("connect", () => {
          console.log("✅ MQTT connected");
          setConnected(true);

          client.subscribe(`esp32/${uid}/pub`, (err) => {
            if (err) console.error("❌ Subscription failed:", err);
          });
        });

        const handleMqttMessage = (payload) => {
          try {
            const data = JSON.parse(payload.toString());
            const now = Date.now();

            // 1. Keep the device's online status active: update lastReceivedTime 
            // at most once every 15 seconds to prevent stale timeouts without lagging scroll.
            if (now - lastTimestampRef.current > 15000) {
              setLastReceivedTime(now);
              lastTimestampRef.current = now;
            }

            // 2. Check if the readings have a significant change (>= 1.0 point difference)
            // compared to what is currently displayed on the UI.
            if (!hasSignificantChange(lastAcceptedDataRef.current, data)) {
              return;
            }

            pendingDataRef.current = data;

            // Show first message immediately so the dashboard doesn't feel blank on load
            if (isFirstMessageRef.current) {
              setMessage(data);
              lastAcceptedDataRef.current = data;
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

        client.on("message", (topic, payload) => {
          handleMqttMessage(payload);
        });

        client.on("error", (err) => console.error("MQTT error:", err));
        client.on("close", () => {
          console.warn("🚫 MQTT connection closed");
          setConnected(false);
        });
      } catch (err) {
        console.error("❌ Error setting up MQTT:", err);
      }
    };

    setupSensorMqtt();
    return () => {
      client?.end();
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
    };
  }, [uid]);

  return { message, connected, lastReceivedTime };
};
