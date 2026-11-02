import React from "react";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import "./PaymentHoldBanner.scss";

export const PaymentHoldBanner = ({
  reason,
  billingStatus,
  holdType = "PAYMENT",
  uid,
}) => {
  const isTechnical = holdType === "TECHNICAL" || holdType === "MAINTENANCE";
  const isRecording = billingStatus === "PAYMENT_HOLD_RECORDING";

  const bannerClass = isTechnical
    ? "hold-technical"
    : isRecording
      ? "hold-recording"
      : "hold-blocked";

  return (
    <div className={`payment-hold-banner ${bannerClass}`}>
      <div className="banner-top-row">
        <div className="banner-icon">
          {isTechnical ? (
            <BuildOutlinedIcon style={{ fontSize: "2.6rem" }} />
          ) : (
            <LockOutlinedIcon style={{ fontSize: "2.6rem" }} />
          )}
        </div>
        <div className="banner-main-text">
          <div className="banner-header">
            <h3>
              {isTechnical
                ? "Technical Issue / System Maintenance"
                : "Dashboard Telemetry Suspended"}
            </h3>
            <span className="status-tag">
              {isTechnical
                ? "Technical Diagnostics"
                : isRecording
                  ? "Payment Pending"
                  : "Account Suspended"}
            </span>
          </div>

          <p className="banner-reason">
            {reason ||
              (isTechnical
                ? "Your farm data stream is temporarily paused by our technical team for scheduled maintenance, sensor recalibration, or network diagnostics."
                : "Live and historical data visualization is temporarily locked due to an outstanding invoice or account hold.")}
          </p>
        </div>
      </div>

      {/* Cloud Persistence Guarantee */}
      {isRecording ? (
        <div className="banner-alert recording-info">
          <CloudDoneOutlinedIcon className="sub-icon" />
          <span>
            <strong>Safe Guard Active:</strong> Your farm hardware (<code>{uid}</code>) is connected and safely recording all sensor readings into the cloud. No data is lost.
          </span>
        </div>
      ) : (
        <div className="banner-alert blocked-info">
          <ErrorOutlineIcon className="sub-icon" />
          <span>
            Telemetry streaming and database storage for <code>{uid}</code> are temporarily paused.
          </span>
        </div>
      )}

      {/* Prominent Contact Box for Queries */}
      <div className="contact-agrowtein-box">
        <div className="contact-prompt">
          <h4>Contact Agrowtein Team for More Queries</h4>
          <p>
            Have questions regarding this status or need immediate assistance? Our support and engineering teams are ready to help.
          </p>
        </div>
        <div className="contact-actions">
          <a
            href={`mailto:support@agrowtein.com?subject=Query regarding Farm ${uid || ""}&body=Hello Agrowtein Team,%0D%0A%0D%0AI have a query regarding my farm (${uid || ""}):%0D%0A`}
            className="contact-btn email-btn"
          >
            <EmailOutlinedIcon className="btn-icon" /> Email Support
          </a>
          <a
            href="https://wa.me/919110851838?text=Hello%20Agrowtein%20Team%2C%20I%20have%20a%20query%20regarding%20my%20farm%20dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-btn helpdesk-btn"
          >
            <SupportAgentOutlinedIcon className="btn-icon" /> Contact Helpdesk
          </a>
        </div>
      </div>
    </div>
  );
};

export default PaymentHoldBanner;
