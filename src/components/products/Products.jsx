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
  const [loading, setLoading] = useState(true); // State to track loading status

  useEffect(() => {
    const productsFetch = async () => {
      setLoading(true); // Set loading to true when starting the fetch
      const data = await fetchProducts();
      setProducts(data);
      setLoading(false); // Set loading to false once data is fetched
    };
    productsFetch();
  }, []);

  const { user } = useContext(UserContext);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;
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

  const userProducts = products;

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = userProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(userProducts.length / productsPerPage);

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
    return product.sensor.some(sensor => sensor._id === sensorType);
  };

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

      {loading ? ( 
        <div className="loading-state">
          <CircularProgress />
        </div>
      ) : !viewingProduct ? (
        <div className="product-grid">
          {currentProducts.map((product) => (
            <div key={product._id} className="product-card">
              <div className="product-info">
                <h2>{product.name}</h2>
                <p>{product.description}</p>
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
          <h2>{viewingProduct.name} - Sensor Data</h2>
          <div className="content-area-charts">
            {hasSensor(viewingProduct, 'Water Level Sensor ID') && (
              <div className="chart-row">
                <CurrentWaterLevel selectedDates={selectedDates} />
                <WaterLevelHistory selectedDates={selectedDates} />
              </div>
            )}
            {hasSensor(viewingProduct, 'PH Sensor ID') && (
              <div className="chart-row">
                <CurrentPHValue selectedDates={selectedDates} />
                <PHValueHistory selectedDates={selectedDates} />
              </div>
            )}
            {hasSensor(viewingProduct, 'Temperature Sensor ID') && (
              <div className="chart-row">
                <CurrentTemperature selectedDates={selectedDates} />
                <TemperatureHistory selectedDates={selectedDates} />
              </div>
            )}
            {hasSensor(viewingProduct, 'Humidity Sensor ID') && (
              <div className="chart-row">
                <CurrentHumidity selectedDates={selectedDates} />
                <HumidityHistory selectedDates={selectedDates} />
              </div>
            )}
            {hasSensor(viewingProduct, 'CO2 Sensor ID') && (
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
