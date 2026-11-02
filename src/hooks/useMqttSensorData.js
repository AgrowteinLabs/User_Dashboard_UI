import { useEffect, useState } from "react";
import mqtt from "mqtt";
import { v4 as uuidv4 } from "uuid";

const baseUrl = import.meta.env.VITE_REACT_APP_API_URL || "https://apiv2.agrowtein.com";
const SIGN_URL_API = `${baseUrl}/api/sign-mqtt-url`;

export const useMqttSensorData = (uid, isBlocked = false) => {
  const [message, setMessage] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastReceivedTime, setLastReceivedTime] = useState(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState(null);
  const [holdType, setHoldType] = useState("PAYMENT");

  useEffect(() => {
    if (!uid || isBlocked) {
      if (isBlocked) setIsSuspended(true);
      setMessage(null);
      setConnected(false);
      return;
    }

    let client;

    const setupSensorMqtt = async () => {
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
          return;
        }

        const data = await res.json().catch(() => ({}));
        if (!data || !data.url) return;

        setIsSuspended(false);
        setSuspensionReason(null);

        client = mqtt.connect(data.url, {
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

        client.on("message", (topic, payload) => {
          try {
            const data = JSON.parse(payload.toString());
            setMessage(data);
            setLastReceivedTime(Date.now());
          } catch (err) {
            console.error("❌ JSON parse error:", err);
          }
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
    return () => client?.end();
  }, [uid, isBlocked]);

  return { message, connected, lastReceivedTime, isSuspended, suspensionReason, holdType };
};
