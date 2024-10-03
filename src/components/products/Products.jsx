import React, { useState, useEffect } from 'react';
import { MdViewHeadline } from 'react-icons/md';
import { CircularProgress } from '@mui/material';
import { FaCheck, FaProductHunt } from 'react-icons/fa';
import { addDays, differenceInCalendarDays } from 'date-fns';
import { DateRange } from 'react-date-range';
import fetchProducts from '../dashboard/api/fetchProducts';
import CurrentPHValue from '../dashboard/areaCharts/CurrentPHValue';
import PHValueHistory from '../dashboard/areaCharts/Last7DaysPHValue';
import CurrentWaterLevel from '../dashboard/areaCharts/CurrentWaterLevel';
import WaterLevelHistory from '../dashboard/areaCharts/WaterLevelLast7Days';
import CurrentTemperature from '../dashboard/areaCharts/CurrentTemperature';
import TemperatureHistory from '../dashboard/areaCharts/TemperatureHistory';
import './Products.scss';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null); // Conditional rendering for the product being viewed
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

  const filteredProducts = products.filter(product =>
    product.alias.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handleViewProduct = (product) => {
    setViewingProduct(product); // Set the selected product for detailed view
  };

  const handleBackToProducts = () => {
    setViewingProduct(null); // Go back to product list
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const hasSensor = (product) => {
    return product.sensors && product.sensors.length > 0;
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
      alert('Please select a date range of up to 7 days.');
    }
  };

  const handleConfirmDates = () => {
    setConfirmedDates(selectedDates);
    setShowDatePicker(false); // Hide the date picker
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
        <button onClick={() => window.location.href = '/login'}>Go to Login</button>
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

  const currentOrConfirmedStart = confirmedDates ? confirmedDates.startDate : new Date();
  const currentOrConfirmedEnd = confirmedDates ? confirmedDates.endDate : new Date();

  return (
    <div className="product-management-page">
      {/* Conditionally show the product list or product details */}
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
                    <FaProductHunt size={40} />
                  </div>
                  <h2>{product.alias}</h2>
                  <p>{product.productId.name}</p>
                </div>
                <div className="product-actions">
                  {hasSensor(product) && (
                    <button className="view-button" onClick={() => handleViewProduct(product)}>
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
        // Conditional rendering: show product alias and Sensor Data when viewing a product
        <div className="product-details">
          <h2>{viewingProduct.alias} - Sensor Data</h2>

          <div className="sensor-data-actions">
            <button className="back-button" onClick={handleBackToProducts}>Back</button>
            <button className="date-picker-button" onClick={() => setShowDatePicker(!showDatePicker)}>
              Select Date Range
            </button>
          </div>

          {/* Date Range Picker as an Overlay */}
          {showDatePicker && (
            <div className="date-range-overlay">
              <div className="date-range-wrapper">
                <DateRange
                  editableDateInputs={true}
                  onChange={handleDateSelection}
                  moveRangeOnFirstSelection={false}
                  ranges={[{ startDate: selectedDates.startDate, endDate: selectedDates.endDate, key: 'selection' }]}
                  maxDate={new Date()}
                  minDate={addDays(new Date(), -30)}
                  className="calendar-overlay"
                />
                {/* Done Button inside the calendar */}
                <div className="calendar-done-button">
                  <button className="done-button" onClick={handleConfirmDates}>
                    <FaCheck /> Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sensor Charts Display */}
          <div className="content-area-charts">
            {hasSensor(viewingProduct) && (
              <>
                {hasSensor(viewingProduct, '66d442e2772a6d2e0d90aa5b') && (
                  <div className="chart-row">
                    <CurrentTemperature startDate={currentOrConfirmedStart} endDate={currentOrConfirmedEnd} />
                    <TemperatureHistory startDate={currentOrConfirmedStart} endDate={currentOrConfirmedEnd} />
                  </div>
                )}
                {hasSensor(viewingProduct, '66d44324772a6d2e0d90aa5e') && (
                  <div className="chart-row">
                    <CurrentPHValue startDate={currentOrConfirmedStart} endDate={currentOrConfirmedEnd} />
                    <PHValueHistory startDate={currentOrConfirmedStart} endDate={currentOrConfirmedEnd} />
                  </div>
                )}
                {hasSensor(viewingProduct, '66d442e2772a6d2e0d90aa5b') && (
                  <div className="chart-row">
                    <CurrentWaterLevel startDate={currentOrConfirmedStart} endDate={currentOrConfirmedEnd} />
                    <WaterLevelHistory startDate={currentOrConfirmedStart} endDate={currentOrConfirmedEnd} />
                  </div>
                )}
              </>
            )}
          </div>
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
  const pageNumbers = [];

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="pagination">
      {pageNumbers.map(number => (
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
