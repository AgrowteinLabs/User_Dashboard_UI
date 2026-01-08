import mqtt from "mqtt";
import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

const SIGN_URL_API = `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/sign-mqtt-url`;

export const useMqttControl = (uid) => {
  const clientRef = useRef(null);
  const messageListenerRef = useRef(null);

  const publishCommandWithFeedback = (payload, onSuccess, onTimeout) => {
    const client = clientRef.current;
    if (!client?.connected) {
      console.warn("❌ MQTT not connected");
      onTimeout?.();
      return;
    }

    // Timeout for device feedback - 25 seconds
    const FEEDBACK_TIMEOUT = 25000;
    let feedbackTimeoutId = null;
    let feedbackReceived = false;

    const onMessage = (topic, message) => {
      try {
        const feedback = JSON.parse(message.toString());
        console.log("📡 Feedback received:", feedback);
        console.log(
          "🔍 Comparing - Expected pin:",
          payload.pin,
          "Got:",
          feedback.pin,
          "| Expected command:",
          payload.command,
          "Got:",
          feedback.command
        );

        // Match feedback with command
        if (
          feedback.pin === payload.pin &&
          feedback.command === payload.command
        ) {
          console.log("✅ Feedback matched! Device confirmed command.");
          feedbackReceived = true;
          clearTimeout(feedbackTimeoutId);
          client.removeListener("message", onMessage);
          onSuccess?.();
        } else {
          console.log("⚠️ Feedback received but doesn't match this command");
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
          onTimeout?.();
          return;
        }
        console.log("✅ Command published successfully to MQTT broker");
      }
    );

    // Hard timeout if feedback never comes and fallback already triggered
    feedbackTimeoutId = setTimeout(() => {
      console.warn(
        `⏱️ Hard timeout - no device feedback after ${FEEDBACK_TIMEOUT}ms`
      );
      client.removeListener("message", onMessage);
      if (!feedbackReceived) {
        onTimeout?.();
      }
    }, FEEDBACK_TIMEOUT);
  };

  useEffect(() => {
    if (!uid) return;

    const setupMqtt = async () => {
      try {
        console.log(`🔌 Fetching MQTT config for uid: ${uid}`);
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
            `Failed to get MQTT config: ${res.status} - Check backend logs at apiv2.agrowtein.com`
          );
        }

        // Try to parse JSON
        let mqttConfig;
        try {
          mqttConfig = JSON.parse(bodyText);
        } catch (parseError) {
          console.error("❌ Invalid JSON response:", bodyText.slice(0, 500));
          throw new Error(
            `Backend returned non-JSON response. Received: ${bodyText.slice(
              0,
              100
            )}`
          );
        }

        if (!mqttConfig.url) {
          throw new Error("MQTT config missing 'url' property");
        }

        console.log("✅ MQTT config received, connecting...");

        const mqttClient = mqtt.connect(mqttConfig.url, {
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
        console.error("📋 Troubleshooting:");
        console.error("   1. Check backend logs at apiv2.agrowtein.com");
        console.error("   2. Verify AWS IoT credentials are configured");
        console.error(
          "   3. Ensure AWS_IOT_ENDPOINT and AWS_REGION env vars are set"
        );
        console.error("   4. Check IAM permissions for iot:Connect");
      }
    };

    setupMqtt();

    return () => clientRef.current?.end();
  }, [uid]);

  return { publishCommandWithFeedback };
};
