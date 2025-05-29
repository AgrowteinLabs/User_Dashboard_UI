import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fetchIntervalData } from "../../api/fetchHistoryData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";
import "./AiAssistant.scss";

const SensorInsightsChart = ({ uid, optimalRanges }) => {
  const [intervalType, setIntervalType] = useState("daily");
  const [rawHourlyData, setRawHourlyData] = useState([]);
  const [sensorCharts, setSensorCharts] = useState([]);

  useEffect(() => {
    const fetchSensorData = async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);
      const formatDate = (d) => d.toISOString().slice(0, 10);

      try {
        const data = await fetchIntervalData(
          uid,
          formatDate(startDate),
          formatDate(endDate),
          60 // hourly base
        );
        setRawHourlyData(data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchSensorData();
  }, [uid]);

  useEffect(() => {
    if (!rawHourlyData.length) return;

    const grouped = {};

    rawHourlyData.forEach(({ timestamp, data }) => {
      const date = timestamp.split("T")[0];
      const time = timestamp.split("T")[1]?.slice(0, 5);

      Object.entries(data).forEach(([sensor, value]) => {
        if (!optimalRanges[sensor]) return;
        const numVal = typeof value === "number" ? value : parseFloat(value);
        if (!Number.isFinite(numVal)) return;

        if (!grouped[sensor]) grouped[sensor] = [];
        grouped[sensor].push({ date, time, value: Number(numVal.toFixed(2)) });
      });
    });

    const processed = Object.entries(grouped).map(([sensor, entries]) => {
      const optimal = optimalRanges[sensor];
      let data = [];

      if (intervalType === "daily") {
        const byDay = {};
        entries.forEach((e) => {
          if (!byDay[e.date]) byDay[e.date] = [];
          byDay[e.date].push(e.value);
        });

        data = Object.entries(byDay).map(([date, values]) => {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          const status =
            avg < optimal.min
              ? "Below"
              : avg > optimal.max
              ? "Above"
              : "Optimal";
          return { date, value: Number(avg.toFixed(2)), status };
        });
      } else {
        data = entries.map(({ date, time, value }) => {
          const status =
            value < optimal.min
              ? "Below"
              : value > optimal.max
              ? "Above"
              : "Optimal";
          return { date: `${date} ${time}`, value, status };
        });
      }

      const total = data.length;
      const counts = {
        Optimal: data.filter((d) => d.status === "Optimal").length,
        Above: data.filter((d) => d.status === "Above").length,
        Below: data.filter((d) => d.status === "Below").length,
      };

      return {
        sensor,
        data,
        optimal,
        insightSummary: {
          total,
          ...counts,
        },
      };
    });

    setSensorCharts(processed);
  }, [intervalType, rawHourlyData, optimalRanges]);

  const getBarColor = (status) => {
    if (status === "Below") return "#f87171";
    if (status === "Above") return "#fbbf24";
    return "#4ade80";
  };

  return (
    <div className="sensor-insight-wrapper">
      <div className="interval-toggle">
        <button
          className={intervalType === "daily" ? "active" : ""}
          onClick={() => setIntervalType("daily")}
        >
          Daily
        </button>
        <button
          className={intervalType === "hourly" ? "active" : ""}
          onClick={() => setIntervalType("hourly")}
        >
          Hourly
        </button>
      </div>

      {sensorCharts.map(({ sensor, data, optimal }) => (
  <div key={sensor} className="sensor-chart-container" style={{ marginBottom: "2rem" }}>
    <div className="chart-header">
      <h4>{sensor}</h4>
      <p className="optimal-range-label">
        🟩 Optimal Range: {optimal.min} – {optimal.max}
      </p>
    </div>
<br />
    <div
      id={`chart-${sensor}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
          <defs>
            <linearGradient id="optimalRangeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(val) => {
              try {
                return intervalType === "hourly"
                  ? format(parseISO(val.split(" ")[0]), "dd MMM") + "\n" + val.split(" ")[1]
                  : format(parseISO(val), "dd MMM");
              } catch {
                return val;
              }
            }}
            angle={intervalType === "hourly" ? -45 : 0}
            textAnchor={intervalType === "hourly" ? "end" : "middle"}
            height={intervalType === "hourly" ? 60 : 30}
            tick={{ fontSize: 10 }}
          />
          <YAxis />

          <Tooltip
            formatter={(value, name, { payload }) => [value, `Status: ${payload.status}`]}
          />

          <ReferenceArea
            y1={optimal.min}
            y2={optimal.max}
            fill="url(#optimalRangeGradient)"
            stroke="none"
            opacity={0.85}
          />

          <Bar
            dataKey="value"
            radius={[6, 6, 0, 0]}
            label={{ position: "top", fontSize: 10, fill: "#666" }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Moved Legend right below chart */}
      <div
        className="legend"
        style={{
          marginTop: 10,
          display: "flex",
          gap: "1.5rem",
          fontSize: "12px",
          alignItems: "center",
        }}
      >
        <span className="dot optimal" style={{ backgroundColor: "#10b981", width: 12, height: 12, borderRadius: "50%", display: "inline-block" }}></span> Optimal
        <span className="dot above" style={{ backgroundColor: "#facc15", width: 12, height: 12, borderRadius: "50%", display: "inline-block" }}></span> Above
        <span className="dot below" style={{ backgroundColor: "#ef4444", width: 12, height: 12, borderRadius: "50%", display: "inline-block" }}></span> Below
      </div>
    </div>
  </div>
))}

    </div>
  );
};

SensorInsightsChart.propTypes = {
  uid: PropTypes.string.isRequired,
  optimalRanges: PropTypes.object.isRequired,
};

export default SensorInsightsChart;
