import { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import SearchIcon from "@mui/icons-material/Search";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import saveFarmLocation from "../../api/farmLocation";
import { searchPlaces } from "../../api/geocode";
import "./LocationPicker.scss";

// Default view for a fresh picker (India — the app's primary market).
const DEFAULT_CENTER = [20.5937, 78.9629];

// Custom emoji pin (avoids the classic Leaflet default-icon bundling issue).
const pinIcon = L.divIcon({
  className: "fw-pin-icon",
  html: '<span class="fw-pin">📍</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 32],
});

// Leaflet doesn't control the map from props — small bridge components do.
const ClickCatcher = ({ onPick }) => {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
};

const FlyTo = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, Math.max(map.getZoom(), 14), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center && center[0], center && center[1]]);
  return null;
};

ClickCatcher.propTypes = {
  onPick: PropTypes.func.isRequired,
};

FlyTo.propTypes = {
  center: PropTypes.array,
};

// Geocode a saved place name. If the name is a generic farm label (e.g.
// "Kozhikode Farm"), retry without the suffix for a better match.
const geocodeSavedName = async (name) => {
  let res = await searchPlaces(name);
  if (res.results.length === 0) {
    const stripped = name
      .replace(/\s*(farm|plantation|field|house)\s*$/i, "")
      .trim();
    if (stripped && stripped !== name.trim()) {
      res = await searchPlaces(stripped);
    }
  }
  return res.results;
};

const LocationPicker = ({ open, product, onClose, onSaved }) => {
  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  const [name, setName] = useState("");
  const [markerPos, setMarkerPos] = useState(null);
  const [center, setCenter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Place search state
  const [searchValue, setSearchValue] = useState("");
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [autoZoomHint, setAutoZoomHint] = useState(null);
  const searchTimerRef = useRef(null);

  // Clear any pending debounced search on unmount
  useEffect(() => () => clearTimeout(searchTimerRef.current), []);

  // Reset state each time the dialog opens, seeded from the saved location.
  useEffect(() => {
    if (!open) return undefined;
    const loc = product?.location;
    const lat = loc && loc.lat != null ? String(loc.lat) : "";
    const lon = loc && loc.lon != null ? String(loc.lon) : "";
    const savedName = (loc && loc.name) || "";
    setLatInput(lat);
    setLonInput(lon);
    setName(savedName || product?.customName || product?.alias || "");
    const valid =
      lat !== "" &&
      lon !== "" &&
      Number.isFinite(Number(lat)) &&
      Number.isFinite(Number(lon));
    setMarkerPos(valid ? [Number(lat), Number(lon)] : null);
    setCenter(valid ? [Number(lat), Number(lon)] : null);
    setError(null);
    setSaving(false);
    setSearchValue("");
    setSearchOptions([]);
    setSearchError(null);
    setAutoZoomHint(null);

    // The farm already has a place name but no exact coordinates — geocode
    // the name and zoom the map there instead of showing the whole country.
    // A draggable pin drops on the place so the user can refine the exact
    // farm spot before saving.
    if (!valid && savedName.trim()) {
      let cancelled = false;
      (async () => {
        const results = await geocodeSavedName(savedName);
        if (cancelled) return;
        if (results.length > 0) {
          const top = results[0];
          applyCoords(top.lat, top.lon);
          setAutoZoomHint(
            `Zoomed to “${top.name}” — drag the pin for the exact farm spot.`
          );
        } else {
          setAutoZoomHint(
            `Couldn't auto-locate “${savedName.trim()}” — search or click the map instead.`
          );
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const applyCoords = (lat, lng) => {
    setLatInput(String(Number(lat).toFixed(5)));
    setLonInput(String(Number(lng).toFixed(5)));
    setMarkerPos([lat, lng]);
    setCenter([lat, lng]);
    setError(null);
  };

  const handleLatChange = (v) => {
    setLatInput(v);
    const lat = Number(v);
    const lon = Number(lonInput);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      setMarkerPos([lat, lon]);
      setCenter([lat, lon]);
    }
  };

  const handleLonChange = (v) => {
    setLonInput(v);
    const lat = Number(latInput);
    const lon = Number(v);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      setMarkerPos([lat, lon]);
      setCenter([lat, lon]);
    }
  };

  const handleSearchInput = (_, value) => {
    setSearchValue(value);
    clearTimeout(searchTimerRef.current);
    const q = (value || "").trim();
    if (q.length < 3) {
      setSearchOptions([]);
      setSearchError(null);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const res = await searchPlaces(q);
      setSearchLoading(false);
      if (res.error) {
        setSearchOptions([]);
        setSearchError(res.error);
      } else {
        setSearchOptions(res.results);
        setSearchError(null);
      }
    }, 400);
  };

  const handleSelectPlace = (_, value) => {
    if (!value || typeof value === "string") return;
    setSearchValue("");
    setSearchOptions([]);
    applyCoords(value.lat, value.lon);
    setName(value.name);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => applyCoords(pos.coords.latitude, pos.coords.longitude),
      () => setError("Could not get your location — check browser permissions.")
    );
  };

  const handleSave = async () => {
    const lat = Number(latInput);
    const lon = Number(lonInput);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setError("Latitude must be a number between -90 and 90.");
      return;
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      setError("Longitude must be a number between -180 and 180.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await saveFarmLocation(product?.id || product?._id, {
      lat,
      lon,
      name: name.trim() || undefined,
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onSaved(res.data?.location);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>📍 Set farm location</DialogTitle>
      <DialogContent>
        <p className="fw-picker-hint">
          <span className="fw-hint-icon">ℹ️</span>
          Search for a place, click the map, drag the pin, or type coordinates
          below. Weather for the farm uses this location.
        </p>

        <Autocomplete
          className="fw-picker-search"
          freeSolo
          options={searchOptions}
          getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt.name)}
          filterOptions={(x) => x}
          value={searchValue}
          onInputChange={handleSearchInput}
          onChange={handleSelectPlace}
          loading={searchLoading}
          noOptionsText={
            searchValue.trim().length >= 3 && !searchLoading
              ? "No places found"
              : "Type at least 3 characters…"
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search place or address"
              placeholder="e.g. Delhi, India"
              size="small"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <SearchIcon className="fw-search-icon" />
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {searchLoading ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        {searchError && (
          <Alert
            severity="warning"
            className="fw-picker-search-error"
            sx={{ mt: 1 }}
          >
            {searchError} You can still click the map or type coordinates.
          </Alert>
        )}
        {autoZoomHint && (
          <Alert
            severity="info"
            className="fw-auto-zoom-hint"
            sx={{ mt: 1 }}
          >
            {autoZoomHint}
          </Alert>
        )}

        <MapContainer
          className="fw-picker-map"
          center={center || DEFAULT_CENTER}
          zoom={center ? 14 : 5}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCatcher onPick={applyCoords} />
          <FlyTo center={center} />
          {markerPos && (
            <Marker
              position={markerPos}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const ll = e.target.getLatLng();
                  applyCoords(ll.lat, ll.lng);
                },
              }}
            />
          )}
        </MapContainer>

        <div className="fw-picker-coords">
          <TextField
            label="Latitude"
            type="number"
            inputProps={{ step: "any", min: -90, max: 90 }}
            value={latInput}
            onChange={(e) => handleLatChange(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Longitude"
            type="number"
            inputProps={{ step: "any", min: -180, max: 180 }}
            value={lonInput}
            onChange={(e) => handleLonChange(e.target.value)}
            size="small"
            fullWidth
          />
        </div>

        <TextField
          className="fw-picker-name"
          label="Farm / location name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Delhi Farm"
          size="small"
          fullWidth
        />
        {error && (
          <Alert
            severity="error"
            className="fw-picker-error"
            sx={{ mt: 1.5 }}
          >
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Tooltip title="Use your device location">
          <IconButton
            onClick={handleUseMyLocation}
            size="small"
            className="fw-locate-btn"
            aria-label="Use my location"
          >
            <MyLocationIcon />
          </IconButton>
        </Tooltip>
        <Button onClick={onClose} disabled={saving} className="fw-cancel-btn">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          className="fw-save-btn"
        >
          {saving ? "Saving…" : "Save location"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

LocationPicker.propTypes = {
  open: PropTypes.bool.isRequired,
  product: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
};

export default LocationPicker;
