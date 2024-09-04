import React, { useState, useEffect, useContext } from 'react';
import { fetchSensorList } from '../api/fetchsensorlist';
import { CircularProgress } from '@mui/material'; // Import CircularProgress
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
  const [loading, setLoading] = useState(true); // State to manage loading
  const { selectedProductUid } = useContext(ProductContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Set loading to true before fetching
        const data = await fetchSensorList(selectedProductUid);
        // Transform fetched data into the desired format
        const formattedData = data.map(sensor => ({
          id: sensor._id,
          name: sensor.name,
          sensor_id: sensor._id, // Assuming sensor ID is the same as _id
          installation_date: new Date(sensor.createdAt).toLocaleDateString(), // Format date
          status: sensor.errorCode ? "active" : "inactive", // Example status, adjust according to your actual logic
        }));
        setSensorData(formattedData);
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchData();
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
              {sensorData.map((dataItem) => (
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default AreaTable;
