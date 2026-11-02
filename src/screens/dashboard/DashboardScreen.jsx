import { useContext } from "react";
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
  const { selectedProductDetails, selectedProductUid } = useContext(ProductContext);

  const isSuspended =
    selectedProductDetails?.billingStatus &&
    selectedProductDetails.billingStatus !== "ACTIVE";

  return (
    <div className="content-area">
      <AreaTop />
      <br />
      {isSuspended && (
        <PaymentHoldBanner
          reason={selectedProductDetails.statusReason}
          billingStatus={selectedProductDetails.billingStatus}
          uid={selectedProductUid}
        />
      )}
      <AreaCards />
      {!isSuspended && <ControlStatusPanel />}
      {!isSuspended && <AreaCharts />}
      <br />
      <AreaTable />
    </div>
  );
};

export default Dashboard;
