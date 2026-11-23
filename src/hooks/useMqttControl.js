import mqtt from "mqtt";
import { useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const SIGN_URL_API = `${import.meta.env.VITE_REACT_APP_API_URL}/api/sign-mqtt-url`;
const URL_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes (AWS SigV4 presigned URLs typically expire after 15 min)

export const useMqttControl = (uid, onExternalFeedback) => {
  const clientRef = useRef(null);
  const messageListenerRef = useRef(null);
  const externalFeedbackRef = useRef(onExternalFeedback);
  const signedUrlTimeRef = useRef(0);
  const isConnectingRef = useRef(false);
  const refreshTimeoutRef = useRef(null);

  useEffect(() => {
    externalFeedbackRef.current = onExternalFeedback;
  }, [onExternalFeedback]);

  const setupMqtt = useCallback(async () => {
    if (!uid) return;
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    // Clean up any stale client
    if (clientRef.current) {
      try {
        clientRef.current.end(true);
      } catch (_e) {
        /* ignore */
      }
      clientRef.current = null;
    }

    try {
      const res = await fetch(`${SIGN_URL_API}?uid=${uid}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json();
      if (!url) throw new Error("No URL returned from signer");

      signedUrlTimeRef.current = Date.now();

      const mqttClient = mqtt.connect(url, {
        clientId: `mqtt-control-${uuidv4()}`,
        protocol: "wss",
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 8000,
      });

      mqttClient.on("connect", () => {
        console.log("✅ MQTT control connected");
        isConnectingRef.current = false;
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

      const handleStaleConnection = () => {
        const isUrlExpired = Date.now() - signedUrlTimeRef.current > URL_MAX_AGE_MS;
        if (isUrlExpired) {
          console.warn("⚠️ MQTT control URL expired, requesting fresh signed URL...");
          if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = setTimeout(() => {
            refreshTimeoutRef.current = null;
            setupMqtt();
          }, 1500);
        }
      };

      mqttClient.on("error", (err) => {
        console.error("MQTT control error:", err);
        handleStaleConnection();
      });

      mqttClient.on("close", () => {
        console.warn("🚫 MQTT control disconnected");
        handleStaleConnection();
      });

      clientRef.current = mqttClient;
    } catch (e) {
      console.error("❌ Failed to connect MQTT control:", e);
      isConnectingRef.current = false;
    }
  }, [uid]);

  // Wait for client to reach connected state (used if user clicks command immediately upon waking)
  const waitForConnection = useCallback((timeoutMs = 3500) => {
    return new Promise((resolve) => {
      const existing = clientRef.current;
      if (existing?.connected) return resolve(existing);

      const start = Date.now();
      const interval = setInterval(() => {
        const cur = clientRef.current;
        if (cur?.connected) {
          clearInterval(interval);
          resolve(cur);
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve(cur);
        }
      }, 150);
    });
  }, []);

  const publishCommandWithFeedback = async (payload, onSuccess, onTimeout) => {
    let client = clientRef.current;
    const isUrlExpired = Date.now() - signedUrlTimeRef.current > URL_MAX_AGE_MS;

    // If client is disconnected or URL is expired, immediately trigger reconnect and await connection
    if (!client?.connected || isUrlExpired) {
      console.log("🔄 Re-establishing MQTT control connection before sending command...");
      setupMqtt();
      client = await waitForConnection(3500);
    }

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
    setupMqtt();

    // Self-healing on mobile wakeup / network reconnect
    const handleWakeup = () => {
      if (document.visibilityState === "hidden") return;
      const client = clientRef.current;
      const isUrlExpired = Date.now() - signedUrlTimeRef.current > URL_MAX_AGE_MS;
      if (!client?.connected || isUrlExpired) {
        console.log("🔄 App woke from idle: auto-renewing MQTT control signed URL");
        setupMqtt();
      }
    };

    window.addEventListener("online", handleWakeup);
    window.addEventListener("focus", handleWakeup);
    document.addEventListener("visibilitychange", handleWakeup);

    return () => {
      window.removeEventListener("online", handleWakeup);
      window.removeEventListener("focus", handleWakeup);
      document.removeEventListener("visibilitychange", handleWakeup);
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      clientRef.current?.end(true);
    };
  }, [uid, setupMqtt]);

  return { publishCommandWithFeedback };
};
