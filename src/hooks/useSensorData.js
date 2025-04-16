// src/hooks/useSensorData.js
import { useEffect, useState } from "react";
import axios from "axios";

export const useSensorData = (uid) => {
  const [current, setCurrent] = useState({});
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
  
    const baseUrl = import.meta.env.VITE_REACT_APP_API_URL;
  
    const fetchCurrentData = async () => {
        try {
          const res = await axios.get(`${baseUrl}/api/v1/data/realtime/${uid}`);
          const realtime = res.data;
      
          if (!realtime?.data || !realtime.timestamp) {
            setCurrent({});
            return;
          }
      
          const sensorTime = new Date(realtime.timestamp).getTime();
          const now = Date.now();
          const isFresh = now - sensorTime <= 5 * 60 * 1000;
      
          if (!isFresh) {
            console.warn("⚠️ All real-time data is stale.");
            setCurrent({}); // all stale
            return;
          }
      
          // Per-sensor logic
          const validatedData = {};
          Object.entries(realtime.data).forEach(([sensorKey, value]) => {
            if (typeof value === "string" && value.includes("-er")) {
              validatedData[sensorKey] = { status: "error", value };
            } else {
              validatedData[sensorKey] = { status: "ok", value };
            }
          });
      
          setCurrent({ data: validatedData, timestamp: sensorTime });
        } catch (err) {
          console.error("Error fetching real-time data:", err);
          setCurrent({});
        }
      };
      
      
  
    const fetchHistoryData = async () => {
      try {
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
        const res = await axios.post(`${baseUrl}/api/v1/data/${uid}/date`, { startDate, endDate });
  
        const raw = Array.isArray(res.data) ? res.data : [];
        const filtered = {};
        const lastTimestamps = {};
  
        raw.forEach((entry) => {
          const time = new Date(entry.timestamp).getTime();
          for (const [sensor, value] of Object.entries(entry.data)) {
            if (!lastTimestamps[sensor] || time - lastTimestamps[sensor] >= 5 * 60 * 1000) {
              if (!filtered[sensor]) filtered[sensor] = [];
              filtered[sensor].push({ timestamp: time, value });
              lastTimestamps[sensor] = time;
            }
          }
        });
  
        setHistory(filtered);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };
  
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchCurrentData(), fetchHistoryData()]);
      setLoading(false);
    };
  
    fetchData();
  
    const currentInterval = setInterval(fetchCurrentData, 2500); // 2.5 sec
    const historyInterval = setInterval(fetchHistoryData, 20 * 60 * 1000); // 20 mins
  
    return () => {
      clearInterval(currentInterval);
      clearInterval(historyInterval);
    };
  }, [uid]);
  
  

  return { current, history, loading };
};
