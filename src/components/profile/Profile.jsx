import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import "./Profile.scss";
import defaultProfileIcon from '../../assets/defaultProfileIcon.png'; // Path to the fixed profile icon
import  fetchUser  from '../../api/fetchuser';
import { CircularProgress } from '@mui/material';

const Profile = () => {
  const { user } = useContext(UserContext);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null); // State to track errors

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

  if (error) {
    // Handle error (e.g., redirect to login page or show an error message)
    return (
      <div className="error-state">
        <h1>{error}</h1>
        <p>Go to the login page.</p>
        <button  onClick={() => window.location.href = '/login'}>Login</button>
      </div>
    );
  }

  if (!user || !userData) {
    return (
      <div className="loading-state">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-info">
        <img
          src={defaultProfileIcon}  // Use fixed profile icon for all users
          alt="Profile"
          className="profile-picture"
        />
        <h1 className="profile-name">{userData.fullName}</h1>
        <p className="profile-bio">
            {`${userData.address.city}, ${userData.address.state}, ${userData.address.country} - ${userData.address.postalCode}`}
          </p>
      </div>
      <div className="profile-content">
        <div className="profile-card">
          <h2>Contact Information</h2>
          <p>Email: {userData.email}</p>
          <p>Phone: {userData.phoneNumber}</p>
        </div>
        <div className="profile-card">
          <h2>Personal Details</h2>
          <p>Location: {`${userData.address.city}, ${userData.address.state}`}</p>
          <p>Joined: {new Date(userData.dayOfRegistration).toLocaleDateString()}</p>
        </div>
        <div className="profile-card">
          <h2>Interests</h2>
          <p>{user.interests ? user.interests.join(', ') : "No interests listed"}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
