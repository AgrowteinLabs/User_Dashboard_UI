import { useState, useEffect } from "react";
import { useMqttSensorData } from "../../hooks/useMqttSensorData";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import fetchProducts from "../../api/fetchProducts";
import { PropTypes } from 'prop-types';
import { getProductIcon } from "../../utils/productIcons";
import "./ProductsOverview.scss";
import Swal from "sweetalert2";

// Icons & Material UI
import {
  DeviceThermostat,
  AcUnit,
  Water,
  FilterHdr,
  Home,
  Settings as SettingsIcon,
  Group as GroupIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import {
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Tabs,
  Tab,
  Box,
  Typography,
  IconButton,
} from "@mui/material";

const sensorIconMap = {
  Temperature: <DeviceThermostat />,
  Temperature_1: <DeviceThermostat />,
  Temperature_2: <DeviceThermostat />,
  Humidity: <AcUnit />,
  Humidity_1: <AcUnit />,
  Humidity_2: <AcUnit />,
  CO2: <FilterHdr />,
  CO2_Sensor_1: <FilterHdr />,
  CO2_Sensor_2: <FilterHdr />,
  CO2_Sensor_3: <FilterHdr />,
  CO2_Sensor_4: <FilterHdr />,
  Water_Used: <Water />
};

const ProductsOverview = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHomepage, setIsHomepage] = useState(localStorage.getItem("homepagePreference") || "dashboard");

  // Groups and Filtering
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [openGroupsModal, setOpenGroupsModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Product Settings Modals
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [settingsTab, setSettingsTab] = useState(0);
  const [customName, setCustomName] = useState("");
  const [productGroup, setProductGroup] = useState("");
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePerm, setSharePerm] = useState("read");
  const [shareError, setShareError] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const getProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts();
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data && !data.error) {
        setProducts([]);
      } else {
        setError(data.error || "No products available.");
      }
    } catch (err) {
      setError("Error fetching products: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(`${url}/api/v1/user/groups`, { credentials: "include" });
      if (res.ok) {
        const result = await res.json();
        setGroups(result.data?.groups || []);
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  useEffect(() => {
    getProducts();
    fetchGroups();
  }, []);

  const handleSetHomepage = (page) => {
    localStorage.setItem("homepagePreference", page);
    setIsHomepage(page);
  };

  // Group Operations
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(`${url}/api/v1/user/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newGroupName }),
      });
      if (res.ok) {
        Swal.fire("Success", "Room/Group created successfully!", "success");
        setNewGroupName("");
        fetchGroups();
      }
    } catch (err) {
      Swal.fire("Error", "Failed to create group", "error");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    const confirm = await Swal.fire({
      title: "Delete room?",
      text: "Devices in this room will keep working — they'll just become ungrouped.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });
    if (!confirm.isConfirmed) return;

    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(`${url}/api/v1/user/groups/${groupId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        Swal.fire("Deleted", "Room/Group deleted successfully!", "success");
        fetchGroups();
        if (selectedGroup === groupId) setSelectedGroup("all");
      }
    } catch (err) {
      Swal.fire("Error", "Failed to delete group", "error");
    }
  };

  // Product Operations
  const handleOpenSettings = (product) => {
    setSelectedProduct(product);
    setSettingsTab(0);
    setCustomName(product.customName || product.alias || "");
    setProductGroup(product.group || "");
    setNotifEnabled(product.config?.notificationsEnabled !== false);
    setShareEmail("");
    setSharePerm("read");
    setShareError("");
  };

  const handleSaveProductSettings = async () => {
    if (!selectedProduct) return;
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const productId = selectedProduct.id || selectedProduct._id;

      // 1. Rename if customName changed
      if (customName !== (selectedProduct.customName || selectedProduct.alias)) {
        await fetch(`${url}/api/v1/products/${productId}/rename`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ customName }),
        });
      }

      // 2. Settings update
      const settingsRes = await fetch(`${url}/api/v1/products/${productId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          notificationsEnabled: notifEnabled,
          group: productGroup,
        }),
      });

      if (settingsRes.ok) {
        Swal.fire("Success", "Device settings saved successfully!", "success");
        setSelectedProduct(null);
        getProducts();
        fetchGroups(); // Settings might change group product lists
      }
    } catch (err) {
      Swal.fire("Error", "Failed to save settings", "error");
    }
  };

  const handleShareProduct = async () => {
    if (!selectedProduct) return;
    const email = shareEmail.trim();
    if (!email) {
      setShareError("Enter the recipient's email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setShareError("Enter a valid email address");
      return;
    }
    setShareBusy(true);
    setShareError("");
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const productId = selectedProduct.id || selectedProduct._id;
      const res = await fetch(`${url}/api/v1/products/${productId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, permissions: [sharePerm] }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result?.error?.message || "Failed to share device");
      }
      Swal.fire(
        "Shared",
        `Device shared with ${email} (${sharePerm === "write" ? "Read & Write" : "Read Only"})`,
        "success"
      );
      setShareEmail("");
      // Reflect the share in the open dialog immediately (getProducts()
      // refreshes the list, but selectedProduct holds the pre-share object).
      setSelectedProduct((prev) => (prev ? { ...prev, isShared: true } : prev));
      getProducts(); // refresh so the "Shared" badge appears immediately
    } catch (err) {
      setShareError(err.message || "Failed to share product");
    } finally {
      setShareBusy(false);
    }
  };

  const handleUnlinkProduct = async () => {
    if (!selectedProduct) return;
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will unlink/delete the device from your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, unlink it!",
    });
    if (!confirm.isConfirmed) return;

    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const productId = selectedProduct.id || selectedProduct._id;
      const res = await fetch(`${url}/api/v1/user/product/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        Swal.fire("Unlinked", "Device unlinked successfully!", "success");
        setSelectedProduct(null);
        getProducts();
      }
    } catch (err) {
      Swal.fire("Error", "Failed to unlink device", "error");
    }
  };

  const filteredProducts = products.filter((product) => {
    if (selectedGroup === "all") return true;
    const group = groups.find((g) => g.id === selectedGroup || g.name === selectedGroup);
    return group?.products?.includes(product.id) || group?.products?.includes(product._id);
  });

  if (loading) {
    return (
      <div className="loading-spinner">
        <Skeleton count={3} height={200} width="100%" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-error" style={{ padding: "20px", textAlign: "center" }}>
        <p>{error}</p>
        <Button variant="contained" onClick={getProducts}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="products-overview">
      <div className="header">
        <div className="header-left">
          <h2>Products Overview</h2>
          <p className="header-subtitle">
            <span className="count-chip">{products.length}</span>
            device{products.length !== 1 ? "s" : ""} · Live sensor readings
          </p>
        </div>

        <div className="header-actions">
          <Button variant="outlined" startIcon={<GroupIcon />} onClick={() => setOpenGroupsModal(true)}>
            Rooms
          </Button>

          <Tooltip title="Set as Homepage" arrow>
            <Home
              className="home-icon"
              onClick={() => handleSetHomepage(isHomepage === "productsOverview" ? "dashboard" : "productsOverview")}
              style={{
                cursor: "pointer",
                color: isHomepage === "productsOverview" ? "var(--primary-emerald)" : "var(--text-muted)",
                fontSize: "2rem",
                transition: "color 0.3s ease",
              }}
            />
          </Tooltip>
        </div>
      </div>

      {/* Room Filters */}
      <div className="group-filters">
        <Button
          variant={selectedGroup === "all" ? "contained" : "outlined"}
          onClick={() => setSelectedGroup("all")}
        >
          All Rooms
        </Button>
        {groups.map((g) => (
          <Button
            key={g.id || g._id}
            variant={selectedGroup === (g.id || g._id) ? "contained" : "outlined"}
            onClick={() => setSelectedGroup(g.id || g._id)}
          >
            {g.name}
          </Button>
        ))}
      </div>

      {/* Display sensor data for all products */}
      <div className="sensor-list">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductSensors key={product.uid} product={product} onSettingsClick={handleOpenSettings} />
          ))
        ) : (
          <p>No products to display in this Room.</p>
        )}
      </div>

      {/* Rooms Management Dialog */}
      <Dialog open={openGroupsModal} onClose={() => setOpenGroupsModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Manage Rooms / Groups</DialogTitle>
        <DialogContent>
          <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
            <TextField
              label="Room/Group Name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              fullWidth
              size="small"
            />
            <Button variant="contained" onClick={handleCreateGroup} startIcon={<AddIcon />} sx={{ backgroundColor: "#03856d" }}>
              Add
            </Button>
          </div>
          <Grid container spacing={1} sx={{ mt: 2 }}>
            {groups.map((g) => (
              <Grid item xs={12} key={g.id || g._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", borderBottom: "1px solid #eee" }}>
                <Typography>{g.name} ({g.products?.length || 0} devices)</Typography>
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteGroup(g.id || g._id)}>
                  Delete
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGroupsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Product Settings Dialog */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onClose={() => setSelectedProduct(null)} fullWidth maxWidth="sm">
          <DialogTitle>Manage Device: {selectedProduct.customName || selectedProduct.alias}</DialogTitle>
          <DialogContent>
            <Tabs value={settingsTab} onChange={(_, nv) => setSettingsTab(nv)} sx={{ mb: 2 }}>
              <Tab label="General" />
              <Tab label="Room" />
              <Tab label="Share" />
              <Tab label="Danger" />
            </Tabs>

            {settingsTab === 0 && (
              <Box>
                <TextField
                  fullWidth
                  margin="dense"
                  label="Display Name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
                <FormControlLabel
                  control={<Switch checked={notifEnabled} onChange={(e) => setNotifEnabled(e.target.checked)} />}
                  label="Enable Device Notifications"
                  sx={{ mt: 1, display: "block" }}
                />
              </Box>
            )}

            {settingsTab === 1 && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Assign this device to a Room/Group:</Typography>
                <Select
                  value={productGroup}
                  onChange={(e) => setProductGroup(e.target.value)}
                  fullWidth
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {groups.map((g) => (
                    <MenuItem key={g.id || g._id} value={g.name}>
                      {g.name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            )}

            {settingsTab === 2 && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Share device access with another user:</Typography>
                {selectedProduct.isShared && (
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: "#e8f5e9", borderRadius: 1, border: "1px solid #a5d6a7" }}>
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                      ✓ This device is currently shared
                      {selectedProduct.sharedBy ? " by " + selectedProduct.sharedBy : ""}.
                    </Typography>
                  </Box>
                )}
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={7}>
                    <TextField
                      fullWidth
                      label="User Email"
                      size="small"
                      value={shareEmail}
                      onChange={(e) => {
                        setShareEmail(e.target.value);
                        if (shareError) setShareError("");
                      }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Select
                      fullWidth
                      size="small"
                      value={sharePerm}
                      onChange={(e) => setSharePerm(e.target.value)}
                    >
                      <MenuItem value="read">Read Only</MenuItem>
                      <MenuItem value="write">Read & Write</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={2}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleShareProduct}
                      disabled={shareBusy}
                      sx={{ backgroundColor: "#03856d" }}
                    >
                      Share
                    </Button>
                  </Grid>
                </Grid>
                {shareError && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {shareError}
                  </Typography>
                )}
              </Box>
            )}

            {settingsTab === 3 && (
              <Box sx={{
                p: 2.5,
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: "14px",
                background: "rgba(239,68,68,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}>
                <Typography variant="subtitle1" color="error" sx={{ fontWeight: 800, fontFamily: "var(--font-family-jakarta)" }}>
                  ⚠️ Danger Zone
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  This will permanently unlink the device from your account. All sensor history, threshold configurations, and automation rules for this device will be detached.
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleUnlinkProduct}
                  sx={{
                    alignSelf: "flex-start",
                    textTransform: "none",
                    fontFamily: "var(--font-family-jakarta)",
                    fontWeight: 800,
                    borderRadius: "10px",
                    whiteSpace: "nowrap",
                    px: 3,
                  }}
                >
                  Unlink Device
                </Button>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedProduct(null)}>Cancel</Button>
            {settingsTab !== 2 && settingsTab !== 3 && (
              <Button
                variant="contained"
                onClick={handleSaveProductSettings}
                sx={{
                  textTransform: "none",
                  fontFamily: "var(--font-family-jakarta)",
                  fontWeight: 800,
                  borderRadius: "10px",
                }}
              >
                Save Changes
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

// Child component to handle MQTT data for each product
const ProductSensors = ({ product, onSettingsClick }) => {
  const { uid, customName, alias, status, isShared } = product;
  const displayName = customName || alias;
  const ProductIcon = getProductIcon(uid);

  // The API `status` field is derived from device state, not liveness;
  // prefer the lastSeen heartbeat freshness when present (same as ProductCard).
  const LAST_SEEN_STALE_MS = 5 * 60 * 1000;
  const lastSeenMs = product.lastSeen ? new Date(product.lastSeen).getTime() : null;
  const hasLastSeen = lastSeenMs != null && !Number.isNaN(lastSeenMs);
  const isOnline = hasLastSeen
    ? Date.now() - lastSeenMs < LAST_SEEN_STALE_MS
    : status === "online";

  const { message, loading: mqttLoading, error: mqttError, handleRetry } = useMqttSensorData(uid);

  if (mqttLoading) {
    return (
      <div className="loading-spinner">
        <Skeleton count={3} height={200} width="100%" />
      </div>
    );
  }

  if (mqttError) {
    return (
      <div className="sensor-card">
        <p>{mqttError}</p>
        <button className="sensor-retry" onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  return (
    <div className="sensor-card">
      <div className="sensor-card-glow" />

      <div className="sensor-card-header">
        <div className="sensor-avatar"><ProductIcon /></div>
        <div className="sensor-title-block">
          <h3>{displayName}</h3>
          <div className="sensor-meta">
            <span className={`sensor-status ${isOnline ? "online" : "offline"}`}>
              <span className="status-bullet" />
              {isOnline ? "Online" : "Offline"}
            </span>
            {isShared && <span className="shared-badge">Shared</span>}
          </div>
        </div>
        <IconButton
          size="small"
          className="sensor-settings"
          onClick={() => onSettingsClick(product)}
          aria-label="Device settings"
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </div>

      <div className="sensor-info">
        {message ? (
          Object.entries(message).map(([sensorName, sensorValue], index) => (
            <div key={index} className="sensor-info-item">
              <h4>
                {sensorIconMap[sensorName] || <DeviceThermostat />}
                {sensorName}
              </h4>
              <p className={typeof sensorValue === "string" && sensorValue.includes("er") ? "error-text" : "normal"}>
                {sensorValue !== null
                  ? typeof sensorValue === "string" && sensorValue.includes("er")
                    ? `Error: ${sensorValue}`
                    : typeof sensorValue === "number"
                    ? sensorValue.toFixed(2)
                    : sensorValue
                  : "No Data"}
              </p>
            </div>
          ))
        ) : (
          <p className="sensor-info-empty">No sensor data available for {displayName}.</p>
        )}
      </div>
    </div>
  );
};

ProductSensors.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    uid: PropTypes.string.isRequired,
    alias: PropTypes.string.isRequired,
    customName: PropTypes.string,
    status: PropTypes.string,
    lastSeen: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isShared: PropTypes.bool,
    group: PropTypes.string,
    config: PropTypes.shape({
      notificationsEnabled: PropTypes.bool,
      autoControlEnabled: PropTypes.bool,
    }),
  }).isRequired,
  onSettingsClick: PropTypes.func.isRequired,
};

export default ProductsOverview;
