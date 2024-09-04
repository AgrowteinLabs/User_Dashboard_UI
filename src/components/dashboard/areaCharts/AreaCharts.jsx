import CurrentHumidity from "./CurrentWaterLevel";
import WaterLevelLast7Days from "../../charts/waterlevel/WaterLevelHistory";
import CurrentPHValue from "./CurrentPHValue";
import Last7DaysPHValue from "../../charts/pH/PHValueHistory";
import "./AreaCharts.scss";

const AreaCharts = () => {
  return (
    <section className="content-area-charts">
      <CurrentHumidity />
      <WaterLevelLast7Days />
      <CurrentPHValue />
      <Last7DaysPHValue />
    </section>
  );
};

export default AreaCharts;
