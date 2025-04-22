import { useState } from "react";
import PropTypes from "prop-types";
import { addDays, differenceInDays } from "date-fns";
import { DateRange } from "react-date-range";
import { FaCheck } from "react-icons/fa";
import AreaCharts from "../dashboard/areaCharts/AreaCharts";
import "./Products.scss";

const ProductReadings = ({ product, onBack }) => {
  const [selectedDates, setSelectedDates] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });
  const [confirmedDates, setConfirmedDates] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ product: "", start: "", end: "" });

  const handleDateSelection = (ranges) => {
    const { startDate, endDate } = ranges.selection;
    setSelectedDates({ startDate, endDate });
  };

  const handleConfirmDates = () => {
    const { startDate, endDate } = selectedDates;
    const daysDiff = differenceInDays(endDate, startDate);

    if (daysDiff > 30) {
      setEmailData({
        product: product.alias,
        start: startDate.toLocaleDateString(),
        end: endDate.toLocaleDateString(),
      });
      setShowEmailModal(true);
      return;
    }

    setConfirmedDates({ startDate, endDate });
    setShowDatePicker(false);
  };

  const handleSendEmail = () => {
    const subject = `Request for Historical Data: ${emailData.product}`;
    const body = `
Hello Agrowtein Support Team,

I would like to request sensor data for the product "${emailData.product}" for the following date range:

Start Date: ${emailData.start}
End Date: ${emailData.end}

My account email is: ${localStorage.getItem("email") || "user@example.com"}

Please let me know if you need any further information.

Best regards,
Agrowtrack User`;

    window.location.href = `mailto:support@agrowtein.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowEmailModal(false);
  };

  const currentStart = confirmedDates.startDate;
  const currentEnd = confirmedDates.endDate;

  return (
    <div className="product-details">
      <h2 className="sensor-heading">{product.alias} - Sensor Readings</h2>

      <div className="sensor-data-actions">
        <button className="back-button" onClick={onBack}>Back</button>
        <button className="date-picker-button" onClick={() => setShowDatePicker(!showDatePicker)}>
          Select Date Range
        </button>
      </div>

      {/* Date Picker Overlay */}
      {showDatePicker && (
        <div className="date-range-overlay">
          <div className="date-range-wrapper">
            <DateRange
              editableDateInputs={true}
              onChange={handleDateSelection}
              moveRangeOnFirstSelection={false}
              ranges={[{
                startDate: selectedDates.startDate,
                endDate: selectedDates.endDate,
                key: "selection"
              }]}
              maxDate={new Date()}
              minDate={addDays(new Date(), -180)}
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

      {/* Email Modal */}
      {showEmailModal && (
        <div className="email-modal-overlay">
          <div className="email-modal">
            <h3>Request Historical Data</h3>
            <p>
              You selected a date range older than 30 days.
              Please request this data from our support team.
            </p>
            <p><strong>Product:</strong> {emailData.product}</p>
            <p><strong>Date Range:</strong> {emailData.start} to {emailData.end}</p>

            <div className="email-actions">
              <button className="send-btn" onClick={handleSendEmail}>Send Email</button>
              <button className="cancel-btn" onClick={() => setShowEmailModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Area Chart Section */}
      <section className="sensor-readings-section">
        <AreaCharts
          product={product}
          startDate={currentStart}
          endDate={currentEnd}
        />
      </section>

      {/* Download CSV Option */}
      {differenceInDays(currentEnd, currentStart) <= 30 && (
        <div className="download-btn-wrapper">
          <button
            className="download-btn"
            onClick={() =>
              window.open(
                `https://apiv2.agrowtein.com/api/v1/data/${product._id}/date?start=${currentStart.toISOString()}&end=${currentEnd.toISOString()}`,
                "_blank"
              )
            }
          >
            📥 Download CSV
          </button>
        </div>
      )}
    </div>
  );
};


ProductReadings.propTypes = {
    product: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      alias: PropTypes.string.isRequired,
    }).isRequired,
    onBack: PropTypes.func.isRequired,
  };

export default ProductReadings;
