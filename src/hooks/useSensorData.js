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

        const res = await axios.get(`${baseUrl}/api/v1/data/${uid}/date-interval`, {
          params: { startDate, endDate, interval: 30 }, // default to 30 min
        });

        const raw = Array.isArray(res.data) ? res.data : [];

        // Backend already filtered by 30 min; group by sensor
        const filtered = {};

        raw.forEach((entry) => {
          const time = new Date(entry.timestamp).getTime();

          for (const [sensor, value] of Object.entries(entry.data)) {
            if (!filtered[sensor]) filtered[sensor] = [];
            filtered[sensor].push({ timestamp: time, value });
          }
        });

        setHistory(filtered);
      } catch (err) {
        console.error("❌ Error fetching interval data:", err);
        setHistory({});
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();

    // Optional: auto-refresh every 20 min
    const interval = setInterval(fetchHistoryData, 20 * 60 * 1000);
    return () => clearInterval(interval);
  }, [uid]);

  return { history, loading };
};
