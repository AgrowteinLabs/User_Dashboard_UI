import CurrentWaterLevel from "./CurrentWaterLevel";
import WaterLevelLast7Days from "./WaterLevelLast7Days";
import CurrentPHValue from "./CurrentPHValue";
import Last7DaysPHValue from "./Last7DaysPHValue";
import "./AreaCharts.scss";

const AreaCharts = () => {
  return (
    <section className="content-area-charts">
      <CurrentWaterLevel />
      <WaterLevelLast7Days />
      <CurrentPHValue />
      <Last7DaysPHValue />
    </section>
  );
};

export default AreaCharts;
