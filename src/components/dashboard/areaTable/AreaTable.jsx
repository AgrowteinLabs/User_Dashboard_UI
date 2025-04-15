import { useState, useEffect, useContext } from "react";
import { CircularProgress } from "@mui/material";
import "./AreaTable.scss";
import { ProductContext } from "../../../context/ProductContext";
import swal from "sweetalert";

const TABLE_HEADS = ["Sensor Name", "Status"]; // Updated header

const AreaTable = () => {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedProductUid } = useContext(ProductContext);

  const fetchSensorStatus = async () => {
    if (!selectedProductUid) {
      setSensorData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `https://apiv2.agrowtein.com/api/v1/data/status/${selectedProductUid}`
      );
      const data = await response.json();

      if (response.status !== 200 || !data) {
        swal("Error", "Failed to fetch sensor data.", "error");
        setSensorData([]);
        return;
      }

      setSensorData(data);
    } catch (error) {
      swal("Error", "Failed to fetch sensor data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorStatus(); // Initial fetch

    // Set up interval to refetch every 2 minutes (120,000 ms)
    const intervalId = setInterval(() => {
      fetchSensorStatus();
    }, 120000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [selectedProductUid]);

  return (
    <div className="area-table">
      {loading ? (
        <div className="loading-spinner">
          <CircularProgress />
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              {TABLE_HEADS.map((head, index) => (
                <th key={index}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sensorData.map((sensor, index) => (
              <tr key={index}>
                <td>{sensor.name}</td>
                <td>
                  <div className="dt-status">
                    <span className={`dt-status-dot dot-${sensor.status}`}></span>
                    <span className="dt-status-text">{sensor.status}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AreaTable;