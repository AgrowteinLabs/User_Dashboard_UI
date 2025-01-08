
import React from 'react';
import { AreaCards, AreaCharts, AreaTable, AreaTop } from "../../components";
import WeatherCard from "../../components/dashboard/weather/WeatherCard";

const Dashboard = () => {
  return (
    <div className="content-area">
      <AreaTop />
      <br />
      <WeatherCard />
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
