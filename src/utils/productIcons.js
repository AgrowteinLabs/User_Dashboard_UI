import {
  Agriculture,
  WaterDrop,
  Thermostat,
  Grass,
  Forest,
  Bolt,
  DeviceThermostat,
  AcUnit,
  FilterHdr,
  SolarPower,
  EnergySavingsLeaf,
  Sensors,
  Speed,
} from "@mui/icons-material";

const PRODUCT_ICONS = [
  Agriculture,
  WaterDrop,
  Thermostat,
  Grass,
  Forest,
  Bolt,
  DeviceThermostat,
  AcUnit,
  FilterHdr,
  SolarPower,
  EnergySavingsLeaf,
  Sensors,
  Speed,
];

// Simple string hash so each device gets a stable icon across renders
const hashCode = (str = "") => {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getProductIcon = (seed) => {
  const Icon = PRODUCT_ICONS[hashCode(String(seed || "")) % PRODUCT_ICONS.length];
  return Icon;
};
