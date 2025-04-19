import { useEffect, useRef } from "react";
import mqtt from "mqtt";

/**
 * Hook to initialize MQTT connection for sending control commands to ESP32.
 * @param {string} uid - The unique product ID used in topic.
 * @returns {function} sendCommand - Function to publish control commands.
 */
export const useMqttControl = (uid) => {
  const clientRef = useRef(null);
  const topic = `esp32/${uid}/sub`; // control topic

  useEffect(() => {
    if (!uid) return;

    const connect = () => {
      const clientId = `frontend-${Math.random().toString(16).substr(2, 8)}`;
      const brokerUrl = "wss://a1zv6fodtw8hm-ats.iot.ap-south-1.amazonaws.com/mqtt"; // Replace with your broker URL

      clientRef.current = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 5000,
        // Use auth if needed
        // username: "xyz",
        // password: "abc",
      });

      clientRef.current.on("connect", () => {
        console.log("✅ MQTT Control Connected");
      });

      clientRef.current.on("error", (err) => {
        console.error("❌ MQTT Control Error:", err);
      });

      clientRef.current.on("close", () => {
        console.warn("🚫 MQTT Control Disconnected");
      });
    };

    connect();

    return () => {
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, [uid]);

  /**
   * Sends a control command to the device.
   * @param {object} payload - Command object, e.g., { pin: "P1", action: "on", type: "manual" }
   */
  const sendCommand = (payload) => {
    if (!clientRef.current || !clientRef.current.connected) {
      console.warn("MQTT not connected");
      return;
    }

    try {
      const message = JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      });

      clientRef.current.publish(topic, message, {}, (err) => {
        if (err) {
          console.error("Failed to publish control message:", err);
        } else {
          console.log("✅ Control command sent:", message);
        }
      });
    } catch (err) {
      console.error("Error serializing MQTT command:", err);
    }
  };

  return { sendCommand };
};
