import React from "react";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import "./PaymentHoldBanner.scss";

export const PaymentHoldBanner = ({ reason, billingStatus, uid }) => {
  const isRecording = billingStatus === "PAYMENT_HOLD_RECORDING";

  return (
    <div className={`payment-hold-banner ${isRecording ? "hold-recording" : "hold-blocked"}`}>
      <div className="banner-icon">
        <LockOutlinedIcon style={{ fontSize: "2.8rem" }} />
      </div>
      <div className="banner-content">
        <div className="banner-header">
          <h3>Dashboard Telemetry Suspended</h3>
          <span className="status-tag">
            {isRecording ? "Payment Pending" : "Service Suspended"}
          </span>
        </div>
        <p className="banner-reason">
          {reason || "Live and historical data visualization is temporarily locked due to an outstanding invoice or account hold."}
        </p>

        {isRecording ? (
          <div className="banner-alert recording-info">
            <CloudDoneOutlinedIcon className="sub-icon" />
            <span>
              <strong>Safe Guard Active:</strong> Your farm hardware ({uid}) is connected and safely recording sensor readings into the cloud. No farm data will be lost once access is restored.
            </span>
          </div>
        ) : (
          <div className="banner-alert blocked-info">
            <ErrorOutlineIcon className="sub-icon" />
            <span>
              Telemetry storage and real-time streaming for {uid} are paused. Please clear pending dues to resume data ingestion.
            </span>
          </div>
        )}

        <div className="banner-footer">
          <span>Need help resolving this? Contact your administrator or support at <strong>billing@agrowtein.com</strong></span>
        </div>
      </div>
    </div>
  );
};

export default PaymentHoldBanner;
