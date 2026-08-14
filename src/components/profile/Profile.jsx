import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/UserContext";
import fetchUser from "../../api/fetchuser";
import "./Profile.scss";
import defaultProfileIcon from "../../assets/defaultProfileIcon.png";
import {
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  Divider,
} from "@mui/material";
import {
  MdEmail,
  MdPhone,
  MdCalendarToday,
  MdLocationOn,
  MdLock,
  MdPhotoCamera,
  MdSettings,
  MdEdit,
  MdContactPhone,
  MdPerson,
} from "react-icons/md";
import Swal from "sweetalert2";
import { useNotificationManager } from "../../hooks/useNotificationManager";

const getCountryFlag = (country) => {
  const countryCode = {
    India: "🇮🇳",
    USA: "🇺🇸",
    Canada: "🇨🇦",
    Germany: "🇩🇪",
    France: "🇫🇷",
  }[country];
  return countryCode || "";
};

const Profile = () => {
  const { user } = useContext(UserContext);
  const { pushNotification } = useNotificationManager();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Edit Profile States
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editZipCode, setEditZipCode] = useState("");

  // Preferences & Notifications States
  const [preferences, setPreferences] = useState(null);
  const [notifSettings, setNotifSettings] = useState(null);

  const handleOpenEditModal = () => {
    setEditName(userData?.name || userData?.fullName || "");
    setEditPhone(userData?.phone || userData?.phoneNumber || "");
    setEditStreet(userData?.address?.street || "");
    setEditCity(userData?.address?.city || "");
    setEditState(userData?.address?.state || "");
    setEditCountry(userData?.address?.country || "");
    setEditZipCode(userData?.address?.zipCode || "");
    setOpenEditModal(true);
  };

  const handleEditProfile = async () => {
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(`${url}/api/v1/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          address: {
            street: editStreet,
            city: editCity,
            state: editState,
            country: editCountry,
            zipCode: editZipCode,
          },
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || result.message || "Failed to update profile");
      Swal.fire("Success", "Profile updated successfully!", "success");
      setUserData(result.data);
      setOpenEditModal(false);
    } catch (err) {
      Swal.fire("Error", err.message || "Something went wrong", "error");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      return Swal.fire("Error", "Image too large. Maximum size is 2MB", "error");
    }
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(`${url}/api/v1/user/upload-avatar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || result.message || "Failed to upload avatar");
      Swal.fire("Success", "Avatar uploaded successfully!", "success");
      setUserData((prev) => ({ ...prev, avatar: result.data.avatarUrl }));
    } catch (err) {
      Swal.fire("Error", err.message || "Something went wrong", "error");
    }
  };

  const handleUpdatePreferences = async (updatedPrefs) => {
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(`${url}/api/v1/user/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedPrefs),
      });
      const result = await res.json();
      if (res.ok) {
        setPreferences(result.data);
        pushNotification({ type: "success", message: "Preferences updated successfully", time: new Date().toLocaleString() });
      }
    } catch (err) {
      console.error("Failed to update preferences:", err);
    }
  };

  const handleUpdateNotifSettings = async (updatedSettings) => {
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(`${url}/api/v1/user/notifications/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedSettings),
      });
      const result = await res.json();
      if (res.ok) {
        setNotifSettings(result.data);
        pushNotification({ type: "success", message: "Notification settings updated", time: new Date().toLocaleString() });
      }
    } catch (err) {
      console.error("Failed to update notification settings:", err);
    }
  };

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const url = import.meta.env.VITE_REACT_APP_API_URL;
        const prefRes = await fetch(`${url}/api/v1/user/preferences`, { credentials: "include" });
        if (prefRes.ok) { const prefData = await prefRes.json(); setPreferences(prefData.data); }
        const notifRes = await fetch(`${url}/api/v1/user/notifications/settings`, { credentials: "include" });
        if (notifRes.ok) { const notifData = await notifRes.json(); setNotifSettings(notifData.data); }
      } catch (err) { console.error("Failed to load preferences/settings:", err); }
    };
    fetchPrefs();
  }, []);

  useEffect(() => {
    const getUserData = async () => {
      const data = await fetchUser();
      if (data.error) { setError(data.error); return; }
      setUserData(data);
    };
    getUserData();
  }, []);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) return Swal.fire("Error", "New passwords do not match", "error");
    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(`${url}/api/v1/user/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: oldPassword, newPassword, confirmPassword }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed");
      Swal.fire("Success", "Password changed successfully!", "success");
      pushNotification({ type: "success", message: "Password changed successfully", time: new Date().toLocaleString() });
      setOpenModal(false);
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      Swal.fire("Error", err.message || "Something went wrong", "error");
    }
  };

  if (error) return (
    <div className="profile-error">
      <h2>{error}</h2>
      <button onClick={() => (window.location.href = "/login")}>Go to Login</button>
    </div>
  );

  if (!user || !userData) return (
    <div className="profile-loading">
      <CircularProgress />
      <span>Loading profile…</span>
    </div>
  );

  const getAvatarUrl = (avatar) => {
    if (!avatar) return defaultProfileIcon;
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
    const baseUrl = import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:4500";
    return `${baseUrl}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
  };

  const address = userData?.address || {};
  const city = address.city || "";
  const state = address.state || "";
  const country = address.country || "";
  const locationStr = [city, state, country ? `${getCountryFlag(country)} ${country}` : ""].filter(Boolean).join(", ");

  return (
    <div className="profile-page">

      {/* ── Hero ─────────────────────────────── */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <img src={getAvatarUrl(userData.avatar)} alt="Profile" className="profile-picture" />
          <label htmlFor="avatar-upload-input" className="avatar-upload-label" title="Change photo">
            <MdPhotoCamera />
          </label>
          <input
            id="avatar-upload-input"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
        </div>

        <div className="profile-hero-info">
          <h1 className="profile-name">{userData.fullName || userData.name || "Unknown User"}</h1>
          <p className="profile-location">
            <MdLocationOn />
            {locationStr || "No location set"}
          </p>
        </div>

        <div className="profile-hero-actions">
          <button className="profile-action-btn btn-primary" onClick={handleOpenEditModal}>
            <MdEdit /> Edit Profile
          </button>
          <button className="profile-action-btn btn-outline" onClick={() => setOpenModal(true)}>
            <MdLock /> Change Password
          </button>
        </div>
      </div>

      {/* ── Info Cards ───────────────────────── */}
      <div className="profile-grid">
        <div className="profile-card">
          <div className="card-header">
            <div className="card-icon"><MdContactPhone /></div>
            <h3>Contact Info</h3>
          </div>
          <div className="card-row">
            <MdEmail />
            <span className="label">Email</span>
            {userData.email || "N/A"}
          </div>
          <div className="card-row">
            <MdPhone />
            <span className="label">Phone</span>
            {userData.phone || userData.phoneNumber || "N/A"}
          </div>
        </div>

        <div className="profile-card">
          <div className="card-header">
            <div className="card-icon"><MdPerson /></div>
            <h3>Account Details</h3>
          </div>
          <div className="card-row">
            <MdCalendarToday />
            <span className="label">Joined</span>
            {userData.createdAt || userData.dayOfRegistration
              ? new Date(userData.createdAt || userData.dayOfRegistration).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
              : "N/A"}
          </div>
          {locationStr && (
            <div className="card-row">
              <MdLocationOn />
              <span className="label">Location</span>
              {locationStr}
            </div>
          )}
        </div>
      </div>

      {/* ── Preferences ──────────────────────── */}
      {preferences && (
        <div className="profile-prefs-section">
          <Accordion>
            <AccordionSummary expandIcon={<MdSettings />}>
              <Typography variant="h6">⚙️ Preferences &amp; Notifications</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Theme</Typography>
                  <Select
                    value={preferences.theme || "light"}
                    fullWidth
                    onChange={(e) => handleUpdatePreferences({ ...preferences, theme: e.target.value })}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="auto">Auto</MenuItem>
                  </Select>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Time Format</Typography>
                  <Select
                    value={preferences.timeFormat || "12h"}
                    fullWidth
                    onChange={(e) => handleUpdatePreferences({ ...preferences, timeFormat: e.target.value })}
                  >
                    <MenuItem value="12h">12-Hour (AM/PM)</MenuItem>
                    <MenuItem value="24h">24-Hour</MenuItem>
                  </Select>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                  <Typography variant="subtitle1">Notification Channels</Typography>
                  {[
                    { key: "email", label: "Email Notifications" },
                    { key: "push",  label: "Push Notifications" },
                    { key: "sms",   label: "SMS Notifications" },
                  ].map(({ key, label }) => (
                    <FormControlLabel
                      key={key}
                      control={
                        <Switch
                          checked={!!preferences.notifications?.[key]}
                          onChange={(e) =>
                            handleUpdatePreferences({
                              ...preferences,
                              notifications: { ...preferences.notifications, [key]: e.target.checked },
                            })
                          }
                        />
                      }
                      label={label}
                    />
                  ))}
                </Grid>

                {notifSettings && (
                  <Grid item xs={12}>
                    <Divider />
                    <Typography variant="subtitle1">Quiet Hours</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!notifSettings.globalSettings?.enabled}
                          onChange={(e) =>
                            handleUpdateNotifSettings({
                              ...notifSettings,
                              globalSettings: { ...notifSettings.globalSettings, enabled: e.target.checked },
                            })
                          }
                        />
                      }
                      label="Enable Quiet Hours"
                    />
                    {notifSettings.globalSettings?.enabled && (
                      <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                        <TextField
                          label="Start"
                          type="time"
                          value={notifSettings.globalSettings?.quietHours?.start || "22:00"}
                          onChange={(e) =>
                            handleUpdateNotifSettings({
                              ...notifSettings,
                              globalSettings: {
                                ...notifSettings.globalSettings,
                                quietHours: { ...notifSettings.globalSettings.quietHours, start: e.target.value },
                              },
                            })
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          label="End"
                          type="time"
                          value={notifSettings.globalSettings?.quietHours?.end || "08:00"}
                          onChange={(e) =>
                            handleUpdateNotifSettings({
                              ...notifSettings,
                              globalSettings: {
                                ...notifSettings.globalSettings,
                                quietHours: { ...notifSettings.globalSettings.quietHours, end: e.target.value },
                              },
                            })
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </div>
                    )}
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </div>
      )}

      {/* ── Edit Profile Dialog ───────────────── */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} fullWidth maxWidth="sm" className="profile-dialog">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          {[
            { label: "Name", value: editName, set: setEditName },
            { label: "Phone", value: editPhone, set: setEditPhone },
            { label: "Street", value: editStreet, set: setEditStreet },
            { label: "City", value: editCity, set: setEditCity },
            { label: "State", value: editState, set: setEditState },
            { label: "Country", value: editCountry, set: setEditCountry },
            { label: "Zip Code", value: editZipCode, set: setEditZipCode },
          ].map(({ label, value, set }) => (
            <TextField
              key={label}
              fullWidth
              margin="dense"
              label={label}
              value={value}
              onChange={(e) => set(e.target.value)}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <button className="profile-action-btn btn-outline" onClick={() => setOpenEditModal(false)}>Cancel</button>
          <button className="profile-action-btn btn-primary" onClick={handleEditProfile}>Save Changes</button>
        </DialogActions>
      </Dialog>

      {/* ── Change Password Dialog ────────────── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="xs" className="profile-dialog">
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField fullWidth type="password" margin="dense" label="Current Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
          <TextField fullWidth type="password" margin="dense" label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <TextField fullWidth type="password" margin="dense" label="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <button className="profile-action-btn btn-outline" onClick={() => setOpenModal(false)}>Cancel</button>
          <button className="profile-action-btn btn-primary" onClick={handleChangePassword}>Update Password</button>
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default Profile;
