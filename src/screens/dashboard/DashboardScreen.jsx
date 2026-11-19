import { useState, useContext } from "react";
import { ProductContext } from "../../context/ProductContext";
import PaymentHoldBanner from "../../components/PaymentHoldBanner";
import {
  AreaCards,
  AreaCharts,
  AreaTable,
  AreaTop,
  ControlStatusPanel,
} from "../../components";

const Dashboard = () => {
  const [configExpanded, setConfigExpanded] = useState(false);
  const { selectedProductDetails, selectedProductUid } = useContext(ProductContext);

  const isSuspended = Boolean(
    selectedProductDetails?.billingStatus &&
    selectedProductDetails.billingStatus !== "ACTIVE"
  );

  return (
    <div className="content-area">
      {/* Dynamic Topbar */}
      <AreaTop />

      {/* Payment Hold Notification Banner if account/device is suspended */}
      {isSuspended && (
        <PaymentHoldBanner
          reason={selectedProductDetails?.statusReason}
          billingStatus={selectedProductDetails?.billingStatus}
          holdType={selectedProductDetails?.holdType}
          uid={selectedProductUid}
        />
      )}

      {/* Main Two-Column Dashboard Layout */}
      <div className="dashboard-grid">
        {/* Left Column: ~67% width (col-8) */}
        <div className={isSuspended ? "col-12" : "col-8"}>
          <AreaCards expanded={configExpanded} setExpanded={setConfigExpanded} />
        </div>

        {/* Right Column: ~33% width (col-4) */}
        {!isSuspended && (
          <div className="col-4">
            <ControlStatusPanel
              configExpanded={configExpanded}
              setConfigExpanded={setConfigExpanded}
            />
          </div>
        )}

        {/* Interactive Analytics Charts (hidden if suspended) */}
        {!isSuspended && (
          <div className="col-12">
            <AreaCharts />
          </div>
        )}

        {/* Live Telemetry Data Grid */}
        <div className="col-12">
          <AreaTable />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
