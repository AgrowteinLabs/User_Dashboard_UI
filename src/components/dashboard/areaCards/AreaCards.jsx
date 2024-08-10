import AreaCard from "./AreaCard";
import "./AreaCards.scss";

const AreaCards = () => {  

  return (
    <section className="content-area-cards">
      <AreaCard
        colors={["#e4e8ef", "#475be8"]}
        cardInfo={{
          title: "Current Time",
        }}
        type="time"
      />
      <AreaCard
        colors={["#e4e8ef", "#4ce13f"]}
        cardInfo={{
          title: "Current Temperature",
        }}
        type="temperature"
        className="center-card"
      />
      <AreaCard
        colors={["#e4e8ef", "#f29a2e"]}
        cardInfo={{
          title: "Power Switch",
        }}
        type="power"
      />
    </section>
  );
};

export default AreaCards;
