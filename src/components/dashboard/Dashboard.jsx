// import React, { useContext, useEffect, useState } from "react";
// import { UserContext } from "../../context/UserContext";
// import { ProductContext } from "../../context/ProductContext"; // Import ProductContext
// import AreaCards from "./areaCards/AreaCards";
// import SensorChart from "./SensorChart";
// import ErrorBoundary from "./ErrorBoundary"; // Adjust the import as needed
// import { fetchSensorList } from "./api/fetchsensorlist";

// const Dashboard = () => {
//   const { user } = useContext(UserContext);
//   const { selectedProductUid } = useContext(ProductContext); // Access selectedProductUid from ProductContext
//   const [isLoading, setIsLoading] = useState(true);
//   const [fetchedSensors, setFetchedSensors] = useState([]); // Store fetched sensors

//   useEffect(() => {
//     const userid = localStorage.getItem("userId");
//     confirm("User ID: " + userid);

//     if (!userid) {
//       window.location.href = "/login"; // Redirect if userId not found
//     } else {
//       setIsLoading(false); // Set loading to false if userId exists
//     }

//     // Fetch sensor list when component mounts
//     fetchSensorList()
//       .then((data) => {
//         setFetchedSensors(data);
//       })
//       .catch((error) => {
//         console.error("Error fetching sensors:", error);
//       });
//   }, []);

//   if (isLoading) {
//     return <div>Loading...</div>;
//   }

//   if (!user) {
//     return <div>Loading user data...</div>;
//   }

//   // Create a function to check if a sensor is active in the fetched sensor list
//   const isSensorActive = (sensorName) => {
//     return fetchedSensors.some((sensor) => sensor.name.toLowerCase() === sensorName.toLowerCase() && sensor.state === "ON");
//   };

//   return (
//     <div className="dashboard">
//       <ErrorBoundary>
//         <AreaCards />
//       </ErrorBoundary>
//       <div className="sensor-charts">
//         {isSensorActive("Humidity") && (
//           <>
//             <SensorChart title="Current Humidity" type="currentHumidity" />
//             <SensorChart title="Last 7 Days Humidity Levels" type="last7DaysHumidity" />
//           </>
//         )}
//         {isSensorActive("Co2") && (
//           <>
//             <SensorChart title="Current CO₂ Levels" type="currentCo2" />
//             <SensorChart title="Last 7 Days CO₂ Levels" type="last7DaysCo2" />
//           </>
//         )}
//         {/* Add other sensors as needed in a similar way */}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
