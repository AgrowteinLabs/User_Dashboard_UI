import mqtt from "mqtt";
import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

const SIGN_URL_API = "https://apiv2.agrowtein.com/api/sign-mqtt-url";

export const useMqttControl = (uid) => {
  const clientRef = useRef(null);

  const publishCommandWithFeedback = (payload, onSuccess, onTimeout) => {
    const client = clientRef.current;
    if (!client?.connected) return console.warn("❌ MQTT not connected");

    const timeoutId = setTimeout(() => {
      client.removeListener("message", onMessage);
      onTimeout?.();
    }, 10000);

    const onMessage = (topic, message) => {
      try {
        const feedback = JSON.parse(message.toString());
        if (feedback.pin === payload.pin && feedback.command === payload.command) {
          clearTimeout(timeoutId);
          client.removeListener("message", onMessage);
          onSuccess?.();
        }
      } catch (err) {
        console.warn("⚠️ Invalid feedback received", err);
      }
    };

    client.on("message", onMessage);

    client.publish(`esp32/${uid}/sub`, JSON.stringify(payload), {}, (err) => {
      if (err) {
        clearTimeout(timeoutId);
        client.removeListener("message", onMessage);
        console.error("❌ Publish failed", err);
      }
    });
  };

  useEffect(() => {
    if (!uid) return;

    const setupMqtt = async () => {
      try {
        const res = await fetch(`${SIGN_URL_API}?uid=${uid}`);
        const { url } = await res.json();

        const mqttClient = mqtt.connect(url, {
          clientId: `mqtt-control-${uuidv4()}`,
          protocol: "wss",
          clean: true,
          reconnectPeriod: 5000,
        });

        mqttClient.on("connect", () => {
          const topic = `esp32/${uid}/feed`;
          mqttClient.subscribe(topic, (err) => {
            if (err) console.error("❌ Subscription failed", err);
            else console.log(`📡 Subscribed to ${topic}`);
          });
        });

        mqttClient.on("error", (err) => console.error("MQTT error:", err));
        mqttClient.on("close", () => console.warn("🚫 MQTT disconnected"));

        clientRef.current = mqttClient;
      } catch (e) {
        console.error("❌ Failed to connect MQTT:", e);
      }
    };

    setupMqtt();

    return () => clientRef.current?.end();
  }, [uid]);

  return { publishCommandWithFeedback };
};
