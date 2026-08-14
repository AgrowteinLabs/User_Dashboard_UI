import { useEffect, useState, useContext, useCallback } from "react";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Tooltip
} from "@mui/material";
import SettingsRemoteIcon from "@mui/icons-material/SettingsRemote";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import { motion } from "framer-motion";
import { ProductContext } from "../../../context/ProductContext";
import fetchProducts from "../../../api/fetchProducts";
import fetchUser from "../../../api/fetchuser";
import Swal from "sweetalert2";
import { useMqttControl } from "../../../hooks/useMqttControl";
import "./AreaCards.scss";

const ProductSelectorRow = () => {
  const { selectedProductUid, setSelectedProductUid } = useContext(ProductContext);
  const [products, setProducts] = useState([]);
  const [productDetails, setProductDetails] = useState(null);
  const [modeSwitchLoading, setModeSwitchLoading] = useState(false);
  const userId = localStorage.getItem("userId");

  const { publishCommandWithFeedback } = useMqttControl(selectedProductUid);

  const parseApiResponse = async (response) => {
    const rawBody = await response.text();
    const contentType = response.headers.get("content-type") || "";
    if (!rawBody) return null;
    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(rawBody);
      } catch {
        return rawBody;
      }
    }
    try {
      return JSON.parse(rawBody);
    } catch {
      return rawBody;
    }
  };

  const fetchDetails = useCallback(async () => {
    if (!userId || !selectedProductUid) return;
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(`${url}/api/v1/user/product/${userId}`, { credentials: "include" });
      const data = await parseApiResponse(res);
      const selected = data.find((p) => p.uid === selectedProductUid);
      if (selected) {
        setProductDetails(selected);
      }
    } catch (err) {
      console.error("Error loading product details:", err);
    }
  }, [userId, selectedProductUid]);

  useEffect(() => {
    const fetchInitial = async () => {
      const data = await fetchProducts();
      if (Array.isArray(data)) {
        setProducts(data);
        const saved = localStorage.getItem("selectedProductUid") || data[0]?.uid;
        setSelectedProductUid(saved);
        localStorage.setItem("selectedProductUid", saved);
      }
      await fetchUser();
    };
    fetchInitial();
  }, [setSelectedProductUid]);

  useEffect(() => {
    fetchDetails();
  }, [selectedProductUid, userId, fetchDetails]);

  // Listen to external triggers to refresh mode state
  useEffect(() => {
    const handleRefresh = () => fetchDetails();
    window.addEventListener("thresholds-updated", handleRefresh);
    return () => window.removeEventListener("thresholds-updated", handleRefresh);
  }, [fetchDetails]);

  const updateGlobalModeInBackend = async (newMode) => {
    const baseUrl = import.meta.env.VITE_REACT_APP_API_URL;
    const endpointCandidates = [
      { url: `${baseUrl}/api/v1/user/product/mode/${selectedProductUid}`, method: "POST" },
      { url: `${baseUrl}/api/v1/user/product/mode/${selectedProductUid}`, method: "PUT" },
      { url: `${baseUrl}/api/v1/product/${selectedProductUid}/mode`, method: "POST" },
      { url: `${baseUrl}/api/v1/product/${selectedProductUid}/mode`, method: "PUT" },
    ];

    let lastError = null;
    for (const candidate of endpointCandidates) {
      try {
        const response = await fetch(candidate.url, {
          method: candidate.method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: newMode }),
        });
        const result = await parseApiResponse(response);
        if (response.ok) return result;
        const message = result?.message || result || `HTTP ${response.status}`;
        lastError = new Error(`${candidate.method} ${candidate.url} failed: ${message}`);
        if (response.status !== 404) throw lastError;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("Failed to update backend global mode");
  };

  const handleModeToggle = async () => {
    if (!selectedProductUid || modeSwitchLoading || !productDetails?.controls?.length) return;

    const newMode = productDetails.mode === "manual" ? "automate" : "manual";
    setModeSwitchLoading(true);

    Swal.fire({
      title: "Switching mode...",
      text: "Updating product configuration...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      await Promise.all(
        productDetails.controls.map(
          (control) =>
            new Promise((resolve, reject) => {
              const threshold = control.threshHold ?? 1;
              const offset = control.offset ?? control.min ?? 1;
              const supportsAuto = control.supportsAuto !== false;
              const shouldSendAuto = newMode === "automate" && supportsAuto;

              const modePayload =
                shouldSendAuto
                  ? {
                    command: "SetMode",
                    pin: control.pin,
                    mode: "Auto",
                    threshold,
                    offset: Math.max(1, offset),
                  }
                  : {
                    command: "SetMode",
                    pin: control.pin,
                    mode: "Manual",
                  };

              publishCommandWithFeedback(
                modePayload,
                () => resolve(),
                () => reject(new Error(`Device did not confirm mode command for ${control.name || control.pin}`))
              );
            })
        )
      );

      const result = await updateGlobalModeInBackend(newMode);
      await fetchDetails();

      // Dispatch global event so AreaCards config lists sync immediately
      window.dispatchEvent(new CustomEvent("mode-changed", { detail: { mode: newMode } }));

      const messageLines = [
        `Switched to ${newMode.toUpperCase()} mode`,
        `\n✅ Updated: ${result.updatedControls?.length || 0} controls`,
        result.skippedControls?.length > 0 ? `Manual-only: ${result.skippedControls.length} controls` : ""
      ].filter(Boolean);

      Swal.fire("✅ Mode Updated", messageLines.join(""), "success");
    } catch (error) {
      Swal.fire("❌ Failed", error.message || "Could not switch mode. Please try again.", "error");
      await fetchDetails();
    } finally {
      setModeSwitchLoading(false);
    }
  };

  const controls = productDetails?.controls || [];

  return (
    <div className="product-selector-row content-area-cards">
      <div className="dropdown-container">
        <FormControl fullWidth variant="outlined" className="product-select-form">
          <InputLabel shrink>Select Product</InputLabel>
          <Select
            label="Select Product"
            value={selectedProductUid || ""}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedProductUid(val);
              localStorage.setItem("selectedProductUid", val);
            }}
            displayEmpty
          >
            {products.map((p) => (
              <MenuItem key={p._id} value={p.uid}>
                {p.alias}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <div className="area-cards-row">
        <motion.div className="area-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <PrecisionManufacturingIcon className="card-icon" />
          <div className="info-content">
            <p className="info-title">Product</p>
            <p className="info-value">{productDetails?.alias || "—"}</p>
          </div>
        </motion.div>

        <motion.div className="area-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ElectricBoltIcon className="card-icon" />
          <div className="info-content">
            <p className="info-title">Mode</p>
            <div className="mode-toggle">
              <Tooltip title={!controls.length ? "Mode toggle disabled — no controls" : ""} arrow>
                <span>
                  <Switch
                    checked={productDetails?.mode === "automate"}
                    onChange={handleModeToggle}
                    disabled={!controls.length || modeSwitchLoading}
                  />
                </span>
              </Tooltip>
              <span>{productDetails?.mode?.toUpperCase() || "MANUAL"}</span>
            </div>
          </div>
        </motion.div>

        <motion.div className="area-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SettingsRemoteIcon className="card-icon" />
          <div className="info-content">
            <p className="info-title">Controls</p>
            <p className="info-value">{controls.length}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductSelectorRow;
