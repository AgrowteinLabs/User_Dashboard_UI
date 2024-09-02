import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdExitToApp } from 'react-icons/md';
import "./Logout.scss";

const Logout = () => {
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  const handleConfirm = () => {
    setConfirmed(true);

    setTimeout(() => {
      // Clear the userId from localStorage
      localStorage.removeItem('userId');

      // Perform any additional logout logic here (e.g., clearing other tokens, session data, etc.)
      
      // Redirect to the login page
      navigate('/login');
    }, 1500); // Adjust the timeout as needed
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="logout-page">
      {!confirmed ? (
        <div className="logout-container">
          <div className="logout-icon">
            <MdExitToApp size={80} />
          </div>
          <h1 className="logout-title">Confirm Logout</h1>
          <p className="logout-description">Are you sure you want to log out?</p>
          <div className="logout-actions">
            <button onClick={handleConfirm} className="logout-confirm-button">Logout</button>
            <button onClick={handleCancel} className="logout-cancel-button">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="logout-container">
          <h1 className="logout-title">Logged Out</h1>
          <p className="logout-description">Redirecting to login page...</p>
        </div>
      )}
    </div>
  );
};

export default Logout;
