import { useState, useContext } from "react";
import { ProductContext } from "../../context/ProductContext";
import PaymentHoldBanner from "../../components/PaymentHoldBanner";
import {
  AreaCards,
  AreaCharts,
  AreaTable,
  AreaTop,
  ControlStatusPanel,
  FarmWeatherCard,
  FarmHealthCard,
} from "../../components";
import { isFarmHealthHidden } from "../../constants/featureFlags";

const Dashboard = () => {
  const [configExpanded, setConfigExpanded] = useState(false);
  const { selectedProductDetails, selectedProductUid } = useContext(ProductContext);
  const healthHidden = isFarmHealthHidden();

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

      {/* Fluid Dashboard Responsive Grid */}
      <div className="dashboard-grid">
        {/* Row 1: Quick Telemetry Widgets */}
        <div className={healthHidden ? "col-12" : "col-6"}>
          <FarmWeatherCard />
        </div>
        {!healthHidden && (
          <div className="col-6">
            <FarmHealthCard />
          </div>
        )}

        {/* Row 2: Product Controls Center (Full Width) */}
        <div className="col-12">
          <AreaCards expanded={configExpanded} setExpanded={setConfigExpanded} />
        </div>

        {/* Row 3: Controller Status & Live Activity Panel (Full Width below AreaCards) */}
        {!isSuspended && (
          <div className="col-12">
            <ControlStatusPanel configExpanded={configExpanded} />
          </div>
        )}

        {/* Row 4: Interactive Analytics Charts (hidden if suspended) */}
        {!isSuspended && (
          <div className="col-12">
            <AreaCharts />
          </div>
        )}

        {/* Row 5: Live Telemetry Data Grid */}
        <div className="col-12">
          <AreaTable />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
