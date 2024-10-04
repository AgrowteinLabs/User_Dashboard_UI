import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/UserContext";
import { ProductContext } from "../../context/ProductContext"; // Import ProductContext
import AreaCards from "./areaCards/AreaCards";
import SensorChart from "./SensorChart";
import ErrorBoundary from "./ErrorBoundary"; // Adjust the import as needed

const Dashboard = () => {
  const { user } = useContext(UserContext);
  const { selectedProductUid } = useContext(ProductContext); // Access selectedProductUid from ProductContext
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userid = localStorage.getItem("userId");
    confirm("User ID: " + userid);

    if (!userid) {
      window.location.href = "/login"; // Redirect if userId not found
    } else {
      setIsLoading(false); // Set loading to false if userId exists
    }
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="dashboard">
      <ErrorBoundary>
        <AreaCards />
      </ErrorBoundary>
      <div className="sensor-charts">
        {user.sensors.includes("currentWaterLevel") && (
          <SensorChart title="Current Water Level" type="currentWaterLevel" />
        )}
        {user.sensors.includes("currentPh") && (
          <SensorChart title="Current pH Value" type="currentPh" />
        )}
        {user.sensors.includes("last7DaysPh") && (
          <SensorChart title="Last 7 Days pH Levels" type="last7DaysPh" />
        )}
        {user.sensors.includes("last7DaysWaterLevel") && (
          <SensorChart
            title="Last 7 Days Water Levels"
            type="last7DaysWaterLevel"
          />
        )}
        {user.sensors.includes("currentHumidity") && (
          <SensorChart title="Current Humidity" type="currentHumidity" />
        )}
        {user.sensors.includes("last7DaysHumidity") && (
          <SensorChart
            title="Last 7 Days Humidity Levels"
            type="last7DaysHumidity"
          />
        )}
        {user.sensors.includes("currentCo2") && (
          <SensorChart title="Current CO₂ Levels" type="currentCo2" />
        )}
        {user.sensors.includes("last7DaysCo2") && (
          <SensorChart title="Last 7 Days CO₂ Levels" type="last7DaysCo2" />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
