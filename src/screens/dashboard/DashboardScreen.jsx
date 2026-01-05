
import {
  AreaCards,
  AreaCharts,
  AreaTable,
  AreaTop,
  ControlStatusPanel,
} from "../../components";

const Dashboard = () => {
  return (
    <div className="content-area">
      <AreaTop />
      <br />
      <AreaCards />
      <ControlStatusPanel />
      <AreaCharts />
      <br />
      <AreaTable />
    </div>
  );
};

export default Dashboard;
