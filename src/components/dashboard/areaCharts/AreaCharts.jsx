// src/components/AreaCharts/AreaCharts.jsx
import { useContext, useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import Swal from "sweetalert2";
import { ProductContext } from "../../../context/ProductContext";
import { fetchSensorList } from "../../../api/fetchsensorlist";
import { useSensorData } from "../../../hooks/useSensorData";
import DynamicCharts from "../../predefinedcharts/DynamicCharts";
import NoDataPlaceholder from "../../predefinedcharts/NoDataPlaceholder";
import "./AreaCharts.scss";

const AreaCharts = () => {
  const { selectedProductUid } = useContext(ProductContext);
  const { current, history } = useSensorData(selectedProductUid);

  const [availableSensors, setAvailableSensors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSensors = async () => {
      if (!selectedProductUid) {
        setAvailableSensors([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchSensorList(selectedProductUid);
        const sensorNames = data.map((sensor) => sensor.name.toLowerCase());
        setAvailableSensors(sensorNames);
      } catch (err) {
        Swal.fire("Error", "Failed to fetch sensor list.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchSensors();
  }, [selectedProductUid]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <CircularProgress />
      </div>
    );
  }
  

  return (
    <section className="chart-grid">
{Object.keys(current).length === 0 ? (
  <NoDataPlaceholder />
) : (
  <DynamicCharts current={current} history={history} availableSensors={availableSensors} />
)}
    </section>
  );
};

export default AreaCharts;
