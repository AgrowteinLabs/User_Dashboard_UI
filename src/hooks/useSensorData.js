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
        const startDate = new Date(
          Date.now() - 12 * 60 * 60 * 1000
        ).toISOString();

        const res = await axios.get(
          `${baseUrl}/api/v1/data/${uid}/date-interval`,
          {
            params: { startDate, endDate, interval: 60 },
          }
        );

        const raw = Array.isArray(res.data) ? res.data : [];

        const grouped = {};
        raw.forEach(({ timestamp, data }) => {
          const time = new Date(timestamp).getTime();
          for (const [sensor, value] of Object.entries(data)) {
            if (!grouped[sensor]) grouped[sensor] = [];
            grouped[sensor].push({ timestamp: time, value });
          }
        });

        setHistory(grouped);
      } catch (err) {
        console.error("❌ Failed to fetch history data:", err);
        setHistory({});
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();

    const interval = setInterval(fetchHistoryData, 20 * 60 * 1000); // auto refresh every 20 min
    return () => clearInterval(interval);
  }, [uid]);

  return { history, loading };
};
