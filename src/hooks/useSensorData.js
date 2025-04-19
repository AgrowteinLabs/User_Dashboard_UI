import { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = import.meta.env.VITE_REACT_APP_API_URL;

export const useSensorData = (uid) => {
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const fetchHistoryData = async () => {
      try {
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const res = await axios.post(`${baseUrl}/api/v1/data/${uid}/date`, {
          startDate,
          endDate,
        });

        const raw = Array.isArray(res.data) ? res.data : [];

        // Process into { sensorName: [ {timestamp, value}, ... ] }
        const filtered = {};
        const lastTimestamps = {};

        raw.forEach((entry) => {
          const time = new Date(entry.timestamp).getTime();

          for (const [sensor, value] of Object.entries(entry.data)) {
            // Store value every 5 minutes max
            if (!lastTimestamps[sensor] || time - lastTimestamps[sensor] >= 5 * 60 * 1000) {
              if (!filtered[sensor]) filtered[sensor] = [];
              filtered[sensor].push({ timestamp: time, value });
              lastTimestamps[sensor] = time;
            }
          }
        });

        setHistory(filtered);
      } catch (err) {
        console.error("❌ Error fetching history:", err);
        setHistory({});
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();

    // Optional: refresh every 20 minutes
    const interval = setInterval(fetchHistoryData, 20 * 60 * 1000);
    return () => clearInterval(interval);
  }, [uid]);

  return { history, loading };
};
