import { useEffect, useState } from "react";
import mqtt from "mqtt";
import { v4 as uuidv4 } from "uuid";

// ✅ Backend API to fetch signed WebSocket URL
const SIGN_URL_API = "http://localhost:4500/api/sign-mqtt-url";

export const useMqttSensorData = (uid) => {
  const [message, setMessage] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastReceivedTime, setLastReceivedTime] = useState(null);


  useEffect(() => {
    if (!uid) return;
    let client;

    const connect = async () => {
      try {
        const res = await fetch(`${SIGN_URL_API}?uid=${uid}`);
        const { url } = await res.json();

        const clientId = `frontend-${uuidv4()}`;
        const topic = `esp32/${uid}/pub`;

        client = mqtt.connect(url, {
          clientId,
          protocol: "wss",
          clean: true,
          reconnectPeriod: 5000,
          connectTimeout: 8000,
        });

        client.on("connect", () => {
          console.log("✅ MQTT connected");
          setConnected(true);
          client.subscribe(topic, (err) => {
            if (err) console.error("❌ Subscription error:", err);
          });
        });

        client.on("message", (topic, payload) => {
          try {
            const data = JSON.parse(payload.toString());
            setMessage(data);
            setLastReceivedTime(Date.now()); 
          } catch (err) {
            console.error("❌ Error parsing message:", err);
          }
        });

        client.on("error", (err) => console.error("❌ MQTT error:", err));
        client.on("close", () => {
          console.warn("🚫 MQTT connection closed");
          setConnected(false);
        });
      } catch (err) {
        console.error("❌ Failed to connect to MQTT via signed URL:", err);
      }
    };
    connect();

    


    return () => {
      if (client) client.end();
    };

    
  }, [uid]);

  


  return { message, connected, lastReceivedTime };


};
