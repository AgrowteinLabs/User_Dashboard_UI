import { useEffect, useMemo, useRef } from "react";

const normalizeKey = (key) =>
  key
    ?.toString()
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase() || "";

export const useAutoControl = ({
  uid,
  currentData,
  controls,
  publishCommandWithFeedback,
}) => {
  const triggeredRef = useRef({});

  const controlsByLinkedSensor = useMemo(() => {
    const map = {};
    (controls || []).forEach((control) => {
      const linkedSensor =
        control.sensorLinked ||
        control.sensor ||
        control.name ||
        control.controlId;
      const normalizedSensor = normalizeKey(linkedSensor);
      if (normalizedSensor) {
        if (!map[normalizedSensor]) map[normalizedSensor] = [];
        map[normalizedSensor].push({
          control,
          actionOnExceed: control.actionOnExceed || "ON",
          actionOnRecover: control.actionOnRecover || "OFF",
          threshold: Number(control.threshHold ?? control.threshold ?? 0),
          offset: Number(control.offset ?? 0),
        });
      }
    });
    return map;
  }, [controls]);

  useEffect(() => {
    if (
      !uid ||
      !currentData?.data ||
      !Object.keys(controlsByLinkedSensor).length ||
      !publishCommandWithFeedback
    )
      return;

    Object.entries(currentData.data).forEach(([sensorKey, sensorData]) => {
      const normalizedKey = normalizeKey(sensorKey);
      const linkedControls = controlsByLinkedSensor[normalizedKey];
      if (!linkedControls) return;

      const rawValue =
        typeof sensorData === "object" && sensorData?.value !== undefined
          ? sensorData.value
          : sensorData;
      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue)) return;

      linkedControls.forEach(
        ({ control, actionOnExceed, actionOnRecover, threshold, offset }) => {
          if (threshold <= 0) return;

          const controlKey = `${normalizedKey}-${control.controlId}`;
          const releaseBelow = threshold - offset;
          const wasTriggered = triggeredRef.current[controlKey]?.triggered;

          if (numericValue > threshold && !wasTriggered) {
            triggeredRef.current[controlKey] = { triggered: true };

            console.info("⚡ Auto-control triggered", {
              sensorKey,
              value: numericValue,
              threshold,
              action: actionOnExceed,
            });

            publishCommandWithFeedback(
              { command: "SetPower", pin: control.pin, state: actionOnExceed },
              () => {
                console.info(
                  "✅ Auto-control command executed:",
                  control.name,
                  actionOnExceed
                );
              },
              () => {
                console.warn("⚠️ Auto-control failed for", control.name);
              }
            );
          } else if (wasTriggered && numericValue <= releaseBelow) {
            triggeredRef.current[controlKey] = { triggered: false };

            console.info("⚡ Auto-control recovery", {
              sensorKey,
              value: numericValue,
              releaseBelow,
              action: actionOnRecover,
            });

            publishCommandWithFeedback(
              { command: "SetPower", pin: control.pin, state: actionOnRecover },
              () => {
                console.info(
                  "✅ Auto-control recovery executed:",
                  control.name,
                  actionOnRecover
                );
              },
              () => {
                console.warn(
                  "⚠️ Auto-control recovery failed for",
                  control.name
                );
              }
            );
          }
        }
      );
    });
  }, [currentData, controlsByLinkedSensor, publishCommandWithFeedback, uid]);
};
