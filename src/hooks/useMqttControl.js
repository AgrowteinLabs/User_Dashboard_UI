import mqtt from "mqtt";
import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

const SIGN_URL_API = `${import.meta.env.VITE_REACT_APP_API_URL}/api/sign-mqtt-url`;

export const useMqttControl = (uid, onExternalFeedback) => {
  const clientRef = useRef(null);
  const messageListenerRef = useRef(null);
  const externalFeedbackRef = useRef(onExternalFeedback);

  useEffect(() => {
    externalFeedbackRef.current = onExternalFeedback;
  }, [onExternalFeedback]);

  const publishCommandWithFeedback = (payload, onSuccess, onTimeout) => {
    const client = clientRef.current;
    if (!client?.connected) {
      console.warn("❌ MQTT not connected");
      onTimeout?.(new Error("MQTT not connected"));
      return;
    }

    // Timeout for device feedback - 25 seconds (§3)
    const FEEDBACK_TIMEOUT = 25000;
    let feedbackTimeoutId = null;
    let feedbackReceived = false;

    const onMessage = (_topic, message) => {
      try {
        const feedback = JSON.parse(message.toString());
        console.log("📡 Feedback received:", feedback);

        // Normalize matching
        const pinMatch =
          String(feedback.pin || "").trim().toUpperCase() ===
          String(payload.pin || "").trim().toUpperCase();
        const cmdMatch =
          String(feedback.command || "").trim().toLowerCase() ===
          String(payload.command || "").trim().toLowerCase();

        // Match feedback with command
        if (pinMatch && cmdMatch) {
          console.log("✅ Feedback matched! Device confirmed command:", feedback);
          feedbackReceived = true;
          clearTimeout(feedbackTimeoutId);
          client.removeListener("message", onMessage);

          if (feedback.status === "error") {
            onTimeout?.(new Error(feedback.message || "Device returned error"));
          } else {
            onSuccess?.(feedback);
          }
        }
      } catch (err) {
        console.warn("⚠️ Invalid feedback received", err);
      }
    };

    client.on("message", onMessage);
    messageListenerRef.current = onMessage;

    console.log(`📤 Publishing command to esp32/${uid}/sub:`, payload);

    client.publish(
      `esp32/${uid}/sub`,
      JSON.stringify(payload),
      { qos: 1 },
      (err) => {
        if (err) {
          clearTimeout(feedbackTimeoutId);
          client.removeListener("message", onMessage);
          console.error("❌ Publish failed", err);
          onTimeout?.(err);
          return;
        }
        console.log("✅ Command published successfully to MQTT broker");
      }
    );

    // 25s timeout for device acknowledgement (§3)
    feedbackTimeoutId = setTimeout(() => {
      console.warn(
        `⏱️ Hard timeout - no device feedback after ${FEEDBACK_TIMEOUT}ms`
      );
      client.removeListener("message", onMessage);
      if (!feedbackReceived) {
        onTimeout?.(new Error("Timeout: device did not respond within 25 seconds"));
      }
    }, FEEDBACK_TIMEOUT);
  };

  useEffect(() => {
    if (!uid) return;

    const setupMqtt = async () => {
      try {
        const res = await fetch(`${SIGN_URL_API}?uid=${uid}`, { credentials: "include" });
        const { url } = await res.json();

        const mqttClient = mqtt.connect(url, {
          clientId: `mqtt-control-${uuidv4()}`,
          protocol: "wss",
          clean: true,
          reconnectPeriod: 5000,
        });

        mqttClient.on("connect", () => {
          const feedTopic = `esp32/${uid}/feed`;
          const msgTopic = `esp32/${uid}/msg`;
          mqttClient.subscribe([feedTopic, msgTopic], (err) => {
            if (err) console.error("❌ Subscription failed", err);
            else console.log(`📡 Subscribed to ${feedTopic} and ${msgTopic}`);
          });
        });

        // Global feed listener for cross-platform synchronization (§2 & §4)
        mqttClient.on("message", (_topic, message) => {
          try {
            const data = JSON.parse(message.toString());
            externalFeedbackRef.current?.(data);
          } catch {
            /* ignore non-json */
          }
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
