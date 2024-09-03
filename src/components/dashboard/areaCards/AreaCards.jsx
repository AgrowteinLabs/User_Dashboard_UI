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
            // Set the first product UID as default only if it's not already set
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
    // Find the selected product's controls based on the selected UID
    const selectedProduct = products.find(product => product.uid === selectedProductUid);
    if (selectedProduct && selectedProduct.controls) {
      setSelectedControls(Object.values(selectedProduct.controls));
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
        {selectedControls.map((control, index) => (
          <AreaCard
            key={index}
            colors={["#e4e8ef", "#f29a2e"]}
            cardInfo={{
              title: control, // Use the control name as the title
            }}
            type="power"
          />
        ))}
      </div>
    </section>
  );
};

export default AreaCards;
