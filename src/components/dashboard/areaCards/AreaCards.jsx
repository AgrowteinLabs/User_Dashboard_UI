import React, { useEffect, useState, useContext } from "react";
import AreaCard from "./AreaCard";
import "./AreaCards.scss";
import fetchProducts from "../api/fetchProducts";
import { ProductContext } from "../../../context/ProductContext";

const AreaCards = () => {
  const { selectedProductUid, setSelectedProductUid } = useContext(ProductContext);
  const [products, setProducts] = useState([]);
  const [selectedControls, setSelectedControls] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchProducts();
        if (data && data.length > 0) {
          setProducts(data);
          if (!selectedProductUid) {
            setSelectedProductUid(data[0].uid);
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchData();
  }, [selectedProductUid, setSelectedProductUid]);

  useEffect(() => {
    const selectedProduct = products.find(product => product.uid === selectedProductUid);
    if (selectedProduct && selectedProduct.controls) {
      setSelectedControls(Object.entries(selectedProduct.controls));
    }
  }, [selectedProductUid, products]);

  const handleProductChange = (event) => {
    setSelectedProductUid(event.target.value);
  };

  return (
    <section className="content-area-cards">
      <div className="dropdown-container">
        <select value={selectedProductUid} onChange={handleProductChange}>
          {products.map((product) => (
            <option key={product._id} value={product.uid}>
              {product.alias}
            </option>
          ))}
        </select>
      </div>

      <div className="area-cards-row">
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
        {selectedControls.map(([controlKey, controlName], index) => (
          <AreaCard
            key={index}
            colors={["#e4e8ef", "#f29a2e"]}
            cardInfo={{
              title: controlName,
            }}
            type="power"
            controlName={controlName}
            controlKey={controlKey}
          />
        ))}
      </div>
    </section>
  );
};

export default AreaCards;
