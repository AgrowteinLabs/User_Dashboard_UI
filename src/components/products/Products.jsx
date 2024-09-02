import React, { useState, useContext, useRef, useEffect } from 'react';
import { MdViewHeadline } from 'react-icons/md';
import { UserContext } from '../../context/UserContext';
import CurrentPHValue from '../charts/pH/CurrentPHValue';
import PHValueHistory from '../charts/pH/PHValueHistory';
import CurrentWaterLevel from '../charts/waterlevel/CurrentWaterLevel';
import WaterLevelHistory from '../charts/waterlevel/WaterLevelHistory';
import CurrentTemperature from '../charts/temperature/CurrentTemperature';
import TemperatureHistory from '../charts/temperature/TemperatureHistory';
import CurrentHumidity from '../charts/humidity/CurrentHumidity';
import HumidityHistory from '../charts/humidity/HumidityHistory';
import CurrentCO2Level from '../charts/CO2/CurrentCO2Level';
import CO2History from '../charts/CO2/CO2History';
import { addDays } from 'date-fns';
import { DateRange } from 'react-date-range';
import './Products.scss';
import fetchProducts from '../dashboard/api/fetchProducts';
import { CircularProgress } from '@mui/material';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(() => {
    const savedProduct = sessionStorage.getItem('viewingProduct');
    return savedProduct ? JSON.parse(savedProduct) : null;
  });
  const [selectedDates, setSelectedDates] = useState({
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRangeRef = useRef(null);

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

  const { user } = useContext(UserContext);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const handleViewProduct = (product) => {
    setViewingProduct(product);
    sessionStorage.setItem('viewingProduct', JSON.stringify(product));
    setShowDatePicker(false);
  };

  const handleBackToProducts = () => {
    setViewingProduct(null);
    sessionStorage.removeItem('viewingProduct');
    setShowDatePicker(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleClickOutside = (event) => {
    if (dateRangeRef.current && !dateRangeRef.current.contains(event.target)) {
      setShowDatePicker(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const hasSensor = (product, sensorType) => {
    return product.sensors && product.sensors.some(sensor => sensor.sensorId._id === sensorType);
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

  return (
    <div className="product-management-page">
      <div className="products-header">
        <h1>Products</h1>
        {viewingProduct && (
          <div className="date-picker-container" ref={dateRangeRef}>
            <button className="date-picker-button" onClick={() => setShowDatePicker(!showDatePicker)}>
              Select Date Range
            </button>
            {showDatePicker && (
              <div className="date-range-wrapper">
                <DateRange
                  editableDateInputs={true}
                  onChange={(item) => setSelectedDates({
                    startDate: item.selection.startDate,
                    endDate: item.selection.endDate,
                  })}
                  moveRangeOnFirstSelection={false}
                  ranges={[selectedDates]}
                  showMonthAndYearPickers={true}
                  maxDate={new Date()}
                  minDate={addDays(new Date(), -7)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {!viewingProduct ? (
        <div className="product-grid">
          {currentProducts.map((product) => (
            <div key={product._id} className="product-card">
              <div className="product-info">
                <h2>{product.productId.name}</h2>
                <p>{product.productId.description}</p>
                <p>{product.alias}</p>
                <p>{product.location}</p>
                <p>{product.state}</p>
              </div>
              <div className="product-actions">
                <button className="view-button" onClick={() => handleViewProduct(product)}>
                  <MdViewHeadline size={20} />
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="product-details">
          <h2>{viewingProduct.productId.name} - Sensor Data</h2>
          <div className="content-area-charts">
            {hasSensor(viewingProduct, '66d442e2772a6d2e0d90aa5b') && (
              <div className="chart-row">
                <CurrentWaterLevel selectedDates={selectedDates} />
                <WaterLevelHistory selectedDates={selectedDates} />
              </div>
            )}
            {hasSensor(viewingProduct, '66d44324772a6d2e0d90aa5e') && (
              <div className="chart-row">
                <CurrentPHValue selectedDates={selectedDates} />
                <PHValueHistory selectedDates={selectedDates} />
              </div>
            )}
            {hasSensor(viewingProduct, '66d442e2772a6d2e0d90aa5b') && (
              <div className="chart-row">
                <CurrentTemperature selectedDates={selectedDates} />
                <TemperatureHistory selectedDates={selectedDates} />
              </div>
            )}
            {hasSensor(viewingProduct, '66d44324772a6d2e0d90aa5e') && (
              <div className="chart-row">
                <CurrentHumidity selectedDates={selectedDates} />
                <HumidityHistory selectedDates={selectedDates} />
              </div>
            )}
            {hasSensor(viewingProduct, '66d44366772a6d2e0d90aa63') && (
              <div className="chart-row">
                <CurrentCO2Level selectedDates={selectedDates} />
                <CO2History selectedDates={selectedDates} />
              </div>
            )}
            {/* Add more sensor charts here */}
          </div>
          <button onClick={handleBackToProducts}>Back to Products</button>
        </div>
      )}

      {!viewingProduct && totalPages > 1 && (
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
