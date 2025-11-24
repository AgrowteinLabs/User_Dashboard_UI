import { useEffect, useState, useContext, useMemo } from "react";
import { fetchSensorList } from "../../../api/fetchsensorlist";
import "./AreaCharts.scss";
import { CircularProgress } from "@mui/material";
import { ProductContext } from "../../../context/ProductContext";
import Swal from "sweetalert2";
import { useSensorData } from "../../../hooks/useSensorData";
import { useMqttSensorData } from "../../../hooks/useMqttSensorData";
import DynamicCharts from "../../predefinedcharts/DynamicCharts";
import NoDataPlaceholder from "../../predefinedcharts/NoDataPlaceholder";
import DeviceStatusBanner from "../../predefinedcharts/DeviceStatusBanner";
import { useInView } from "react-intersection-observer";

const AreaCharts = () => {
  const { selectedProductUid } = useContext(ProductContext);
  const [availableSensors, setAvailableSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistoryOnly, setShowHistoryOnly] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const { current, history, loading: historyLoading } = useSensorData(selectedProductUid);
  const { message: mqttMessage, lastReceivedTime } =
    useMqttSensorData(selectedProductUid);

  // Intersection Observer for lazy loading charts
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  // Fetch available sensor names for this product
  useEffect(() => {
    const fetchSensorMetadata = async () => {
      setLoading(true);

      if (!selectedProductUid) {
        setTimeout(() => setLoading(false), 3000);
        return;
      }

      try {
        const sensors = await fetchSensorList(selectedProductUid);
        const lowerSensors = sensors.map((s) => s.name.toLowerCase());
        setAvailableSensors(lowerSensors);
      } catch (err) {
        Swal.fire("Error", "Failed to fetch sensor list.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchSensorMetadata();
  }, [selectedProductUid]);

  // Memoized real-time data (from MQTT or fallback to REST)
  const finalCurrent = useMemo(() => {
    if (mqttMessage && Object.keys(mqttMessage).length > 0) {
      const timestamp = lastReceivedTime || Date.now();
      return {
        data: Object.fromEntries(
          Object.entries(mqttMessage).map(([k, v]) => [
            k,
            {
              status:
                typeof v === "string" && v.includes("-er") ? "error" : "ok",
              value: v,
              timestamp: timestamp,
            },
          ])
        ),
        timestamp: timestamp, // Add global timestamp
      };
    }
    return current;
  }, [mqttMessage, current, lastReceivedTime]);

  // Check if all real-time sensors are stale or error
  const isStale = useMemo(() => {
    const sensors = finalCurrent?.data || {};
    const now = Date.now();

    return !Object.values(sensors).some((sensor) => {
      if (!sensor || !sensor.value || sensor.status === "error") return false;

      const sensorTime = sensor.timestamp || now;
      const STALE_THRESHOLD = 60 * 1000;
      return now - sensorTime <= STALE_THRESHOLD;
    });
  }, [finalCurrent]);

  // Auto-hide placeholder if data resumes
  useEffect(() => {
    if (!isStale) {
      setShowHistoryOnly(false);
    }
  }, [isStale]);

  // Last update timestamp (for display)
  useEffect(() => {
    const sensors = finalCurrent?.data || {};
    const timestamps = Object.values(sensors)
      .filter((s) => s.timestamp)
      .map((s) => new Date(s.timestamp));

    if (timestamps.length > 0) {
      const latest = new Date(Math.max(...timestamps.map((d) => d.getTime())));
      setLastUpdated(
        latest.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  }, [finalCurrent]);

  return (
    <section className="content-area-charts" ref={ref}>
      {!loading && <DeviceStatusBanner lastSeen={lastReceivedTime} />}

      {loading ? (
        <div className="loading-spinner">
          <CircularProgress />
        </div>
      ) : isStale && !showHistoryOnly ? (
        <NoDataPlaceholder
          lastUpdated={lastUpdated}
          onShowHistory={() => setShowHistoryOnly(true)}
        />
      ) : (
        inView && (
          <DynamicCharts
            current={finalCurrent}
            history={history}
            availableSensors={availableSensors}
            historyOnly={showHistoryOnly}
            historyLoading={historyLoading}
          />
        )
      )}
    </section>
  );
};

export default AreaCharts;
