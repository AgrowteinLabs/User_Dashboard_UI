import { useEffect, useState } from "react";
import mqtt from "mqtt";
import { v4 as uuidv4 } from "uuid";

const SIGN_URL_API = "https://apiv2.agrowtein.com/api/sign-mqtt-url";

export const useMqttSensorData = (uid) => {
  const [message, setMessage] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastReceivedTime, setLastReceivedTime] = useState(null);

  useEffect(() => {
    if (!uid) return;

    let client;

    const setupSensorMqtt = async () => {
      try {
        const res = await fetch(`${SIGN_URL_API}?uid=${uid}`);
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
  }, [uid]);

  return { message, connected, lastReceivedTime };
};
