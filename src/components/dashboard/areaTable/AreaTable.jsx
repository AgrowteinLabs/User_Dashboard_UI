import React, { useState, useEffect, useContext } from 'react';
import { fetchSensorList } from '../../../api/fetchsensorlist';
import { fetcheddata } from '../../../api/fetchdata'; // Assuming this is the function that fetches real-time data
import { CircularProgress } from '@mui/material';
import "./AreaTable.scss";
import { ProductContext } from '../../../context/ProductContext';

const TABLE_HEADS = [
  "Sensors Used",
  "Sensor ID",
  "Installation Date",
  "Status",
];

const AreaTable = () => {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Error state
  const { selectedProductUid } = useContext(ProductContext);

  // Function to check the sensor status based on the received data
  const checkSensorStatus = (sensor, realTimeData) => {
    // If real-time data is missing for the sensor, mark it as inactive
    if (!realTimeData || !realTimeData[sensor.name]) {
      return 'inactive';
    }

    // If the data value is an error code (e.g., "bot-er"), mark the sensor as inactive
    const sensorData = realTimeData[sensor.name];
    if (typeof sensorData === 'string' && sensorData.includes('-er')) {
      return 'inactive'; // Error code in data, mark as inactive
    }

    // Get the timestamp of the most recent data for the sensor
    const sensorDataTimestamp = realTimeData[sensor.name]?.timestamp;

    if (sensorDataTimestamp) {
      // Get the current time and the time of the most recent data
      const currentTime = new Date();
      const dataTimestamp = new Date(sensorDataTimestamp);

      // Calculate the difference in time in minutes
      const timeDifference = (currentTime - dataTimestamp) / (1000 * 60); // Difference in minutes

      // If more than 30 minutes have passed since the last data update, mark as inactive
      if (timeDifference > 30) {
        return 'inactive';
      }
    }

    // If real-time data is present and within the last 30 minutes, mark the sensor as active
    return 'active';
  };

  useEffect(() => {
    const fetchedData = async () => {
      if (!selectedProductUid) {
        setError("Please select a product to view sensors.");
        setLoading(false); // Stop loading if no product UID
        return;
      }

      try {
        setLoading(true);
        setError(null); // Clear previous errors
        
        // Fetch sensor list
        const sensorList = await fetchSensorList(selectedProductUid);

        // Fetch real-time sensor data
        const realTimeData = await fetcheddata(selectedProductUid);

        if (!sensorList || sensorList.error) {
          setError("Failed to fetch sensor data.");
          setSensorData([]);
          return;
        }

        const formattedData = sensorList.map(sensor => {
          // Get the status based on real-time data and the time check
          const status = checkSensorStatus(sensor, realTimeData.data);
          
          return {
            id: sensor._id,
            name: sensor.name,
            sensor_id: sensor._id,
            installation_date: new Date(sensor.createdAt).toLocaleDateString(),
            status: status, // Set the status based on the check
          };
        });

        setSensorData(formattedData);
      } catch (error) {
        setError("Failed to fetch sensor data.");
      } finally {
        setLoading(false);
      }
    };

    fetchedData();
  }, [selectedProductUid]);

  return (
    <section className="content-area-table">
      <div className="data-table-info">
        <h4 className="data-table-title">Sensors Used</h4>
      </div>
      <div className="data-table-diagram">
        {loading ? (
          <div className="loading-spinner">
            <CircularProgress />
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                {TABLE_HEADS.map((th, index) => (
                  <th key={index}>{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sensorData.length > 0 ? (
                sensorData.map((dataItem) => (
                  <tr key={dataItem.id}>
                    <td>{dataItem.name}</td>
                    <td>{dataItem.sensor_id}</td>
                    <td>{dataItem.installation_date}</td>
                    <td>
                      <div className="dt-status">
                        <span className={`dt-status-dot dot-${dataItem.status}`}></span>
                        <span className="dt-status-text">{dataItem.status}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>
                    No sensors found for this product.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default AreaTable;
