// src/components/profile/Profile.jsx

import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import "./Profile.scss";
import { fetchUser } from '../dashboard/api/fetchuser';
import { CircularProgress } from '@mui/material';

const Profile = () => {
  const { user } = useContext(UserContext);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      const data = await fetchUser();
      setUserData(data);
    };

    getUserData();
  }, []);

  if (!user || !userData) {
    return (
      <div className="loading-state">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img
          src={user.profilePicture}
          alt="Profile"
          className="profile-picture"
        />
        <div className="profile-info">
          <h1 className="profile-name">{userData.fullName}</h1>
          <p className="profile-bio">
            {`${userData.address.city}, ${userData.address.state}, ${userData.address.country} - ${userData.address.postalCode}`}
          </p>
        </div>
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
