import CurrentWaterLevel from "./CurrentWaterLevel";
import HumidityLast7Days from "./WaterLevelLast7Days";
import CurrentPHValue from "./CurrentPHValue";
import Last7DaysPHValue from "./Last7DaysPHValue";
import "./AreaCharts.scss";
import TemperatureHistory from "./TemperatureHistory";
import CurrentTemperature from "./CurrentTemperature";

const AreaCharts = () => {
  return (
    <section className="content-area-charts">
      <CurrentTemperature />
      <TemperatureHistory/>
      <CurrentWaterLevel />
      <HumidityLast7Days />
      <CurrentPHValue />
      <Last7DaysPHValue />
    </section>
  );
};

export default AreaCharts;
