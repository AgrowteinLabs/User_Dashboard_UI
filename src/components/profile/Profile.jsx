import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/UserContext";
import fetchUser from "../../api/fetchuser";
import "./Profile.scss";
import defaultProfileIcon from "../../assets/defaultProfileIcon.png";
import {
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  MdEmail,
  MdPhone,
  MdCalendarToday,
  MdLocationOn,
  MdLock,
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

  useEffect(() => {
    const getUserData = async () => {
      const data = await fetchUser();
      if (data.error) {
        setError(data.error);
        return;
      }
      setUserData(data);
    };
    getUserData();
  }, []);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      return Swal.fire("Error", "New passwords do not match", "error");
    }

    try {
      const url = import.meta.env.VITE_REACT_APP_API_URL;
      const res = await fetch(`${url}/api/v1/users/${userData._id}/newpassword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed");

      Swal.fire("Success", "Password changed successfully!", "success");
      
      pushNotification({
        type: "success",
        message: "Password changed successfully",
        time: new Date().toLocaleString(),
      });

      setOpenModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      Swal.fire("Error", err.message || "Something went wrong", "error");
    }
  };

  if (error) {
    return (
      <div className="profile-error">
        <h2>{error}</h2>
        <button onClick={() => (window.location.href = "/login")}>Login</button>
      </div>
    );
  }

  if (!user || !userData) {
    return (
      <div className="profile-loading">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img src={defaultProfileIcon} alt="Profile" className="profile-picture" />
        <div className="profile-header-details">
          <h1 className="profile-name">{userData.fullName}</h1>
          <p className="profile-location">
            <MdLocationOn />
            {userData.address.city}, {userData.address.state},{" "}
            {getCountryFlag(userData.address.country)} {userData.address.country}
          </p>
        </div>
      </div>

      <div className="profile-sections">
        <div className="profile-card">
          <h3>📞 Contact Info</h3>
          <p><MdEmail /> {userData.email}</p>
          <p><MdPhone /> {userData.phoneNumber}</p>
        </div>

        <div className="profile-card">
          <h3>📅 Personal Details</h3>
          <p><MdCalendarToday /> Joined: {new Date(userData.dayOfRegistration).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="change-password-btn">
        <Button variant="outlined" onClick={() => setOpenModal(true)} startIcon={<MdLock />}>
          Change Password
        </Button>
      </div>

      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            margin="dense"
            label="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <TextField
            fullWidth
            type="password"
            margin="dense"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            fullWidth
            type="password"
            margin="dense"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePassword} sx={{ backgroundColor: "#03856d" }}>
            Save
          </Button>
        </DialogActions>
        
      </Dialog>
    </div>
  );
};

export default Profile;
