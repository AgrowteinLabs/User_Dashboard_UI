import CurrentWaterLevel from "../../charts/waterlevel/CurrentWaterLevel";
import WaterLevelLast7Days from "../../charts/waterlevel/WaterLevelHistory";
import CurrentPHValue from "../../charts/pH/CurrentPHValue";
import Last7DaysPHValue from "../../charts/pH/PHValueHistory";
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
