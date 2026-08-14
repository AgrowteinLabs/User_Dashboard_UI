import { useState } from "react";
import {
  AreaCards,
  AreaCharts,
  AreaTable,
  AreaTop,
  ControlStatusPanel,
  FarmWeatherCard,
  FarmHealthCard,
} from "../../components";

const Dashboard = () => {
  const [configExpanded, setConfigExpanded] = useState(false);

  return (
    <div className="content-area">
      {/* Dynamic Topbar */}
      <AreaTop />
      
      {/* Fluid Dashboard Responsive Grid */}
      <div className="dashboard-grid">
        
        {/* Row 1: Quick Telemetry Widgets */}
        <div className="col-6">
          <FarmWeatherCard />
        </div>
        <div className="col-6">
          <FarmHealthCard />
        </div>

        {/* Row 2: Product Controls & Controller Status Panels (Synchronized Equal Heights) */}
        <div className="col-8">
          <AreaCards expanded={configExpanded} setExpanded={setConfigExpanded} />
        </div>
        <div className="col-4">
          <ControlStatusPanel configExpanded={configExpanded} />
        </div>
        
        {/* Row 3: Interactive Analytics Charts */}
        <div className="col-12">
          <AreaCharts />
        </div>
        
        {/* Row 4: Live Telemetry Data Grid */}
        <div className="col-12">
          <AreaTable />
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;
