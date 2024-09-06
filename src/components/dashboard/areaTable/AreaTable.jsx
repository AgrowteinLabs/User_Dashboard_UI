import React, { useState, useEffect, useContext } from 'react';
import { fetchSensorList } from '../api/fetchsensorlist';
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

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedProductUid) {
        setError("Please select a product to view sensors.");
        setLoading(false); // Stop loading if no product UID
        return;
      }

      try {
        setLoading(true);
        setError(null); // Clear previous errors
        const data = await fetchSensorList(selectedProductUid);
        const formattedData = data.map(sensor => ({
          id: sensor._id,
          name: sensor.name,
          sensor_id: sensor._id,
          installation_date: new Date(sensor.createdAt).toLocaleDateString(),
          status: sensor.state === 'ON' ? "active" : "inactive",
        }));
        setSensorData(formattedData);
      } catch (error) {
        setError("Failed to fetch sensor data.");
      } finally {
        setLoading(false);
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
