import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import AreaCards from './areaCards/AreaCards';
import SensorChart from './SensorChart'; // Adjust the import based on your file structure

const Dashboard = () => {
  const { user } = useContext(UserContext);  // Access user from context
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userid = localStorage.getItem('userId');
    confirm("User ID: " + userid);

    if (!userid) {
      window.location.href = "/login";  // Redirect if userId not found
    } else {
      setIsLoading(false);  // Set loading to false if userId exists
    }
  }, []);  // Run this effect only once when the component mounts

  // Render loading state if still loading
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Check if the user context is still loading
  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="dashboard">
      <AreaCards />
      <div className="sensor-charts">
        {user.sensors.includes('currentWaterLevel') && (
          <SensorChart title="Current Water Level" type="currentWaterLevel" />
        )}
        {user.sensors.includes('currentPh') && (
          <SensorChart title="Current pH Value" type="currentPh" />
        )}
        {user.sensors.includes('last7DaysPh') && (
          <SensorChart title="Last 7 Days pH Levels" type="last7DaysPh" />
        )}
        {user.sensors.includes('last7DaysWaterLevel') && (
          <SensorChart title="Last 7 Days Water Levels" type="last7DaysWaterLevel" />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
