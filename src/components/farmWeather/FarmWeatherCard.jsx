import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ProductContext } from "../../context/ProductContext";
import fetchProducts from "../../api/fetchProducts";
import LocationPicker from "./LocationPicker";
import "./FarmWeatherCard.scss";

// Map backend WMO condition strings (src/services/weather.js) to emoji icons.
const conditionIcon = (condition) => {
  const c = (condition || "").toLowerCase();
  if (c.includes("thunder")) return "⛈️";
  if (c.includes("snow")) return "❄️";
  if (c.includes("rain")) return "🌧️";
  if (c.includes("drizzle")) return "🌦️";
  if (c.includes("fog")) return "🌫️";
  if (c.includes("partly")) return "⛅";
  if (c.includes("cloud") || c.includes("overcast")) return "☁️";
  if (c.includes("sunny") || c.includes("clear")) return "☀️";
  return "🌡️";
};

const FarmWeatherCard = () => {
  const { selectedProductUid } = useContext(ProductContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(false);
    const data = await fetchProducts();
    if (Array.isArray(data)) {
      setProducts(data);
    } else if (data && data.error) {
      setProducts([]);
      setError(true);
    } else {
      setProducts([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts, selectedProductUid]);

  const product = useMemo(() => {
    const uid = selectedProductUid || localStorage.getItem("selectedProductUid");
    if (uid) return products.find((p) => p.uid === uid) || null;
    return products[0] || null;
  }, [products, selectedProductUid]);

  const body = (() => {
    if (loading && products.length === 0) {
      return (
        <div className="farm-weather-card skeleton">Loading weather…</div>
      );
    }

    if (error && products.length === 0) {
      return (
        <div className="farm-weather-card empty">
          <span className="fw-icon">🌡️</span>
          <span>Weather unavailable.</span>
        </div>
      );
    }

    if (!product) {
      return (
        <div className="farm-weather-card empty">
          <span className="fw-icon">📍</span>
          <span>Select a farm to see weather.</span>
        </div>
      );
    }

    const farmName = product.location?.name || product.customName || product.alias || "My Farm";
    const hasCoords = product.location && product.location.lat != null && product.location.lon != null;
    const weather = product.weather || null;

    if (!hasCoords) {
      return (
        <div className="farm-weather-card empty">
          <span className="fw-icon">📍</span>
          <div className="fw-empty-text">
            <strong>{farmName}</strong>
            <span>No location set.</span>
            <button
              type="button"
              className="fw-set-location-btn"
              onClick={() => setPickerOpen(true)}
            >
              📍 Set location
            </button>
          </div>
        </div>
      );
    }

    if (!weather) {
      return (
        <div className="farm-weather-card empty">
          <span className="fw-icon">🌡️</span>
          <div className="fw-empty-text">
            <strong>{farmName}</strong>
            <span>Weather unavailable.</span>
            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <button
                type="button"
                className="fw-action-icon-btn"
                onClick={() => setPickerOpen(true)}
                title="Edit location"
              >
                ✏️
              </button>
              <button
                type="button"
                className="fw-action-icon-btn"
                onClick={loadProducts}
                title="Retry"
              >
                ↻
              </button>
            </div>
          </div>
        </div>
      );
    }

    const temp = Number.isFinite(Number(weather.temperatureC))
      ? `${Math.round(Number(weather.temperatureC))}°C`
      : "—";

    return (
      <div className="farm-weather-card">
        <div className="fw-weather-icon" aria-hidden="true">
          {conditionIcon(weather.condition)}
        </div>
        <div className="fw-main">
          <div className="fw-temp">{temp}</div>
          <div className="fw-condition">{weather.condition || "Unknown"}</div>
        </div>
        <div className="fw-side">
          <div className="fw-farm" title={farmName}>{farmName}</div>
          <div className="fw-humidity">💧 {weather.humidity != null ? `${weather.humidity}%` : "—"}</div>
          <div className="fw-actions">
            <button
              type="button"
              className="fw-action-icon-btn"
              onClick={() => setPickerOpen(true)}
              title="Edit Location"
            >
              ✏️
            </button>
            <button
              type="button"
              className={`fw-action-icon-btn${loading ? " spinning" : ""}`}
              onClick={loadProducts}
              disabled={loading}
              title="Refresh Weather"
            >
              ↻
            </button>
          </div>
        </div>
      </div>
    );
  })();

  return (
    <>
      {body}
      <LocationPicker
        open={pickerOpen}
        product={product}
        onClose={() => setPickerOpen(false)}
        onSaved={() => {
          setPickerOpen(false);
          loadProducts();
        }}
      />
    </>
  );
};

export default FarmWeatherCard;
