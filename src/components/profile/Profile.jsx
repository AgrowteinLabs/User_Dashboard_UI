import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import "./Profile.scss";
import defaultProfileIcon from '../../assets/defaultProfileIcon.png'; // Path to the fixed profile icon

const Profile = () => {
  const { user } = useContext(UserContext);

  if (!user) {
    return <div>Loading...</div>; // Show a loading state while user data is being fetched
  }

  return (
    <div className="profile-page">
      <div className="profile-info">
        <img
          src={defaultProfileIcon}  // Use fixed profile icon for all users
          alt="Profile"
          className="profile-picture"
        />
        <h1 className="profile-name">{user.name}</h1>
        <p className="profile-bio">{user.bio}</p>
      </div>
      <div className="profile-content">
        <div className="profile-card">
          <h2>Contact Information</h2>
          <p>Email: {user.email}</p>
          <p>Phone: {user.phone}</p>
        </div>
        <div className="profile-card">
          <h2>Personal Details</h2>
          <p>Location: {user.location}</p>
          <p>Joined: {user.joined}</p>
        </div>
        <div className="profile-card">
          <h2>Interests</h2>
          <p>{user.interests.join(', ')}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
