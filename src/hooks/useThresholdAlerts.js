import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import fetchProducts from "../api/fetchProducts";

const normalizeKey = (key) =>
  key
    ?.toString()
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase() || "";

export const useThresholdAlerts = ({ uid, currentData, notify }) => {
  const [controls, setControls] = useState([]);
  const triggeredRef = useRef({});
  const loggedKeysRef = useRef({});

  const loadControls = useCallback(async () => {
    if (!uid) return;

    try {
      const data = await fetchProducts();
      if (!Array.isArray(data)) return;

      const product = data.find((p) => p.uid === uid);
      setControls(product?.controls || []);
    } catch (err) {
      console.error("❌ Failed to load controls for alerts:", err);
    }
  }, [uid]);

  useEffect(() => {
    loadControls();
  }, [loadControls]);

  useEffect(() => {
    const handleThresholdUpdate = (event) => {
      const targetUid = event?.detail?.uid;
      if (uid && targetUid && targetUid !== uid) return;
      triggeredRef.current = {};
      loadControls();
    };

    window.addEventListener("thresholds-updated", handleThresholdUpdate);
    return () =>
      window.removeEventListener("thresholds-updated", handleThresholdUpdate);
  }, [loadControls, uid]);

  const normalizedThresholds = useMemo(
    () =>
      controls
        .map((control) => {
          const rawKey =
            control.sensorName ||
            control.sensor ||
            control.name ||
            control.controlId;
          const threshold = Number(
            control.threshHold ?? control.threshold ?? control.thresholdValue
          );
          const offsetValue = Number(control.offset ?? 0);

          return {
            key: normalizeKey(rawKey),
            rawKey,
            threshold: Number.isFinite(threshold) ? threshold : null,
            offset: Number.isFinite(offsetValue) ? offsetValue : 0,
          };
        })
        .filter(
          (item) => item.key && item.threshold !== null && item.threshold > 0
        ),
    [controls]
  );

  useEffect(() => {
    if (!uid || !currentData?.data || !normalizedThresholds.length || !notify)
      return;

    Object.entries(currentData.data).forEach(([sensorKey, sensorData]) => {
      const normalizedKey = normalizeKey(sensorKey);
      const thresholdConfig =
        normalizedThresholds.find((c) => c.key === normalizedKey) ||
        normalizedThresholds.find(
          (c) => normalizedKey.includes(c.key) || c.key.includes(normalizedKey)
        );
      if (!thresholdConfig) {
        if (!loggedKeysRef.current[normalizedKey]) {
          console.debug(
            "ℹ️ No threshold configured for sensor",
            sensorKey,
            "(normalized:",
            normalizedKey,
            ")"
          );
          loggedKeysRef.current[normalizedKey] = true;
        }
        return;
      }

      const rawValue =
        typeof sensorData === "object" &&
        sensorData !== null &&
        "value" in sensorData
          ? sensorData.value
          : sensorData;
      const numericValue = Number(rawValue);

      if (!Number.isFinite(numericValue)) return;

      const { threshold, offset, rawKey } = thresholdConfig;
      const releaseBelow = threshold - offset;
      const wasTriggered = triggeredRef.current[normalizedKey]?.triggered;

      if (numericValue > threshold && !wasTriggered) {
        console.info("🚨 Threshold exceeded", {
          sensorKey,
          normalizedKey,
          value: numericValue,
          threshold,
          offset,
        });

        notify({
          type: "error",
          message: `${
            rawKey || sensorKey
          } is above threshold (${numericValue} > ${threshold})`,
          time: new Date().toLocaleString(),
        });
        triggeredRef.current[normalizedKey] = { triggered: true };
      } else if (wasTriggered && numericValue <= releaseBelow) {
        triggeredRef.current[normalizedKey] = { triggered: false };
      }
    });
  }, [currentData, normalizedThresholds, notify, uid]);
};
