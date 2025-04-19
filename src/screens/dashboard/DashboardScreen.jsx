
import { AreaCards, AreaCharts, AreaTable, AreaTop } from "../../components";

const Dashboard = () => {
  return (
    <div className="content-area">
      <AreaTop />
      <br />
      <AreaCards />
      <br />
      <AreaCharts />
      <br />
      <AreaTable />
    </div>
  );
};

export default Dashboard;
