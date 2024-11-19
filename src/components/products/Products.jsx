import React, { useState, useEffect } from "react";
import { MdViewHeadline } from "react-icons/md";
import { CircularProgress } from "@mui/material";
import { FaCheck } from "react-icons/fa";
import AgricultureIcon from "../../assets/images/agriculture.png";
import { addDays, differenceInCalendarDays } from "date-fns";
import { DateRange } from "react-date-range";
import fetchProducts from "../dashboard/api/fetchProducts";
import CurrentTemperature from "../charts/temperature/CurrentTemperature";
import TemperatureHistory from "../charts/temperature/TemperatureHistory";
import CurrentHumidity from "../charts/humidity/CurrentHumidity";
import HumidityHistory from "../charts/humidity/HumidityHistory";
import CurrentCO2Level from "../charts/CO2/CurrentCO2Level";
import CO2History from "../charts/CO2/CO2History";
import "./Products.scss";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDates, setSelectedDates] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });
  const [confirmedDates, setConfirmedDates] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const productsFetch = async () => {
      setLoading(true);
      const data = await fetchProducts();
      setLoading(false);
      if (data.error) {
        setError(data.error);
      } else if (data.message) {
        setMessage(data.message);
      } else {
        setProducts(data);
      }
    };
    productsFetch();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.alias.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handleViewProduct = (product) => {
    console.log("Selected Product:", product);
    setViewingProduct(product);
  };

  const handleBackToProducts = () => {
    setViewingProduct(null);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const hasSensor = (product, sensorName) => {
    const sensorExists = product.sensors?.some(
      (sensor) => sensor.sensorId && sensor.sensorId.name === sensorName
    );
    console.log(
      `Checking for sensor ${sensorName} in product ${product.alias}: ${sensorExists}`
    );
    return sensorExists;
  };

  const handleDateSelection = (ranges) => {
    const { startDate, endDate } = ranges.selection;
    const daysDifference = differenceInCalendarDays(endDate, startDate);

    if (daysDifference <= 7) {
      setSelectedDates({
        startDate,
        endDate,
      });
    } else {
      alert("Please select a date range of up to 7 days.");
    }
  };

  const handleConfirmDates = () => {
    setConfirmedDates(selectedDates);
    setShowDatePicker(false);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <h1>{error}</h1>
        <p>Go to the login page.</p>
        <button onClick={() => (window.location.href = "/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  if (message) {
    return (
      <div className="message-state">
        <h1>{message}</h1>
      </div>
    );
  }

  const currentOrConfirmedStart = confirmedDates
    ? confirmedDates.startDate
    : new Date();
  const currentOrConfirmedEnd = confirmedDates
    ? confirmedDates.endDate
    : new Date();

  return (
    <div className="product-management-page">
      {!viewingProduct ? (
        <>
          <h1 className="main-heading">Products and Services</h1>
          <div className="products-header">
            <input
              type="text"
              placeholder="Search Products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="product-grid">
            {currentProducts.map((product) => (
              <div key={product._id} className="product-card">
                <div className="product-info">
                  <div className="product-icon">
                    <img
                      src={AgricultureIcon}
                      alt="Agriculture Icon"
                      className="agriculture-icon"
                    />
                  </div>
                  <h2>{product.alias}</h2>
                  <p>{product.productId.name}</p>
                </div>
                <div className="product-actions">
                  {product.sensors?.length > 0 && (
                    <button
                      className="view-button"
                      onClick={() => handleViewProduct(product)}
                    >
                      <MdViewHeadline size={20} className="view-icon" />
                      <span>View Sensor Readings</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="product-details">
          <h2 className="sensor-heading">
            {viewingProduct.alias} - Sensor Data
          </h2>
          <div className="sensor-data-actions">
            <button className="back-button" onClick={handleBackToProducts}>
              Back
            </button>
            <button
              className="date-picker-button"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              Select Date Range
            </button>
          </div>

          {showDatePicker && (
            <div className="date-range-overlay">
              <div className="date-range-wrapper">
                <DateRange
                  editableDateInputs={true}
                  onChange={handleDateSelection}
                  moveRangeOnFirstSelection={false}
                  ranges={[
                    {
                      startDate: selectedDates.startDate,
                      endDate: selectedDates.endDate,
                      key: "selection",
                    },
                  ]}
                  maxDate={new Date()}
                  minDate={addDays(new Date(), -30)}
                  className="calendar-overlay"
                />
                <div className="calendar-done-button">
                  <button className="done-button" onClick={handleConfirmDates}>
                    <FaCheck /> Done
                  </button>
                </div>
              </div>
            </div>
          )}

          <section className="sensor-readings-section">
            {hasSensor(viewingProduct, "Temperature Sensor") && (
              <div className="sensor-card">
                <div className="sensor-header">
                  <h4>Temperature</h4>
                </div>
                <div className="sensor-body">
                  <CurrentTemperature />
                </div>
                <div className="sensor-footer">
                  <TemperatureHistory
                    startDate={currentOrConfirmedStart}
                    endDate={currentOrConfirmedEnd}
                  />
                </div>
              </div>
            )}

            {hasSensor(viewingProduct, "Humidity") && (
              <div className="sensor-card">
                <div className="sensor-header">
                  <h4>Humidity</h4>
                </div>
                <div className="sensor-body">
                  <CurrentHumidity />
                </div>
                <div className="sensor-footer">
                  <HumidityHistory
                    startDate={currentOrConfirmedStart}
                    endDate={currentOrConfirmedEnd}
                  />
                </div>
              </div>
            )}

            {hasSensor(viewingProduct, "Co2") && (
              <div className="sensor-card">
                <div className="sensor-header">
                  <h4>CO2 Levels</h4>
                </div>
                <div className="sensor-body">
                  <CurrentCO2Level />
                </div>
                <div className="sensor-footer">
                  <CO2History
                    startDate={currentOrConfirmedStart}
                    endDate={currentOrConfirmedEnd}
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {totalPages > 1 && !viewingProduct && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      {pageNumbers.map((number) => (
        <button
          key={number}
          className={`page-button ${number === currentPage ? "active" : ""}`}
          onClick={() => onPageChange(number)}
        >
          {number}
        </button>
      ))}
    </div>
  );
};

export default Products;
