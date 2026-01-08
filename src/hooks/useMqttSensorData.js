import { useEffect, useState } from "react";
import mqtt from "mqtt";
import { v4 as uuidv4 } from "uuid";

const SIGN_URL_API = `${
  import.meta.env.VITE_REACT_APP_API_BASE_URL
}/api/sign-mqtt-url`;

export const useMqttSensorData = (uid) => {
  const [message, setMessage] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastReceivedTime, setLastReceivedTime] = useState(null);

  useEffect(() => {
    if (!uid) return;

    let client;

    const setupSensorMqtt = async () => {
      try {
        console.log(`🔌 Fetching MQTT config for sensor-data (uid: ${uid})`);
        const res = await fetch(`${SIGN_URL_API}?uid=${uid}`);

        // Read response body once as text
        const bodyText = await res.text();

        // Check if request succeeded
        if (!res.ok) {
          console.error(
            `❌ Backend returned ${res.status}:`,
            bodyText.slice(0, 500)
          );
          throw new Error(
            `Failed to get MQTT config: ${res.status} - Backend route may not exist`
          );
        }

        // Try to parse JSON
        let mqttConfig;
        try {
          mqttConfig = JSON.parse(bodyText);
        } catch (parseError) {
          console.error("❌ Invalid JSON response:", bodyText.slice(0, 300));
          throw new Error(
            `Backend returned HTML instead of JSON. Route /api/sign-mqtt-url not found.`
          );
        }

        if (!mqttConfig.url) {
          throw new Error("MQTT config missing 'url' property");
        }

        console.log("✅ MQTT config received for sensor-data");

        client = mqtt.connect(mqttConfig.url, {
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
