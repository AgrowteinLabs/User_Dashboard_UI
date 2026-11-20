/**
 * Device Selection constants — pin→device mapping and display metadata.
 *
 * Mirrors the backend src/utils/deviceTypes.js and the Device Selection spec.
 * Keys are uppercase pin names; values are arrays of valid device strings.
 */

/** Valid device types for each pin. */
export const PIN_DEVICE_MAP = {
  P1: ["heater", "cooler"],
  P2: ["humidifier", "dehumidifier"],
  P3: ["co2_injector", "exhaust_fan"],
  P4: ["raise", "lower"],
};

/** Human-readable labels for each pin's sensor. */
export const PIN_SENSOR_LABELS = {
  P1: "Temperature",
  P2: "Humidity",
  P3: "CO₂",
  P4: "Lift",
};

/** Display labels for each device type. */
export const DEVICE_LABELS = {
  heater: "Heater",
  cooler: "Cooler",
  humidifier: "Humidifier",
  dehumidifier: "Dehumidifier",
  co2_injector: "CO₂ Injector",
  exhaust_fan: "Exhaust Fan",
  raise: "Raise",
  lower: "Lower",
};

/** Emoji icons for each device type. */
export const DEVICE_ICONS = {
  heater: "🔥",
  cooler: "❄️",
  humidifier: "💧",
  dehumidifier: "🌬️",
  co2_injector: "🫧",
  exhaust_fan: "🌀",
  raise: "⬆️",
  lower: "⬇️",
};

/** Behavior description for each device type (shown in UI tooltips). */
export const DEVICE_BEHAVIORS = {
  heater: "Turns ON when temperature is BELOW threshold",
  cooler: "Turns ON when temperature is ABOVE threshold",
  humidifier: "Turns ON when humidity is BELOW threshold",
  dehumidifier: "Turns ON when humidity is ABOVE threshold",
  co2_injector: "Turns ON when CO₂ is BELOW threshold",
  exhaust_fan: "Turns ON when CO₂ is ABOVE threshold",
  raise: "Manual lift control",
  lower: "Manual lift control",
};

/** All valid device type strings (flat array). */
export const ALL_DEVICE_TYPES = Object.values(PIN_DEVICE_MAP).flat();

/** All valid pin names. */
export const ALL_PINS = Object.keys(PIN_DEVICE_MAP);

/**
 * Get the display label for a device type.
 * @param {string} device
 * @returns {string}
 */
export const getDeviceLabel = (device) =>
  DEVICE_LABELS[device] || device || "—";

/**
 * Get the icon for a device type.
 * @param {string} device
 * @returns {string}
 */
export const getDeviceIcon = (device) =>
  DEVICE_ICONS[device] || "⚙️";

/**
 * Get valid device options for a given pin.
 * @param {string} pin — e.g. "P1" (case-insensitive)
 * @returns {string[]}
 */
export const getDevicesForPin = (pin) => {
  const normalized = String(pin || "").trim().toUpperCase();
  return PIN_DEVICE_MAP[normalized] || [];
};
