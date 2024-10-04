// import CurrentWaterLevel from "./CurrentWaterLevel";
// import WaterLevelLast7Days from "./WaterLevelLast7Days";
// import CurrentPHValue from "./CurrentPHValue";
// import Last7DaysPHValue from "./Last7DaysPHValue";
import "./AreaCharts.scss";
import TemperatureHistory from "./TemperatureHistory";
import CurrentTemperature from "./CurrentTemperature";
import CurrentHumidity from "./CurrentHumidity";
import Last7DaysHumidity from "./HumidityHistory";
import CurrentCO2 from "./CurrentCO2Level";
import Last7DaysCO2 from "./CO2History";

const AreaCharts = () => {
  return (
    <section className="content-area-charts">
      <CurrentTemperature />
      <TemperatureHistory />
      {/* <CurrentPHValue /> */}
      {/* <Last7DaysPHValue /> */}
      {/* <CurrentWaterLevel /> */}
      {/* <WaterLevelLast7Days /> */}
      <CurrentHumidity />
      <Last7DaysHumidity />
      <CurrentCO2 />
      <Last7DaysCO2 />
    </section>
  );
};

export default AreaCharts;
