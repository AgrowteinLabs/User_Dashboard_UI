// src/components/products/Products.jsx

import React, { useContext } from 'react';
import {
  MdAgriculture,
  MdWaterDrop,
  MdEmojiNature,
  MdOutlinePets,
  MdLocalFlorist,
} from 'react-icons/md';
import { UserContext } from '../../context/UserContext';
import "./Products.scss";

const allProducts = [
  {
    name: "Agventure",
    icon: <MdAgriculture size={48} />,
    description: "Advanced agricultural solutions for modern farming.",
    image: "https://via.placeholder.com/300x200.png?text=Agventure+Product",
  },
  {
    name: "Hydroponics Automation",
    icon: <MdWaterDrop size={48} />,
    description: "Automated hydroponic systems for efficient growth.",
    image: "https://via.placeholder.com/300x200.png?text=Hydroponics+Automation",
  },
  {
    name: "Mushroom Farm Automation",
    icon: <MdEmojiNature size={48} />,
    description: "State-of-the-art automation for mushroom farming.",
    image: "https://via.placeholder.com/300x200.png?text=Mushroom+Farm+Automation",
  },
  {
    name: "Green House Automation",
    icon: <MdLocalFlorist size={48} />,
    description: "Control and monitor greenhouse environments efficiently.",
    image: "https://via.placeholder.com/300x200.png?text=Green+House+Automation",
  },
  {
    name: "Aquaponics Automation",
    icon: <MdOutlinePets size={48} />,
    description: "Integrated systems for aquaponics farming.",
    image: "https://via.placeholder.com/300x200.png?text=Aquaponics+Automation",
  },
];

const Products = () => {
  const { user } = useContext(UserContext);

  const userProducts = allProducts.filter(product =>
    user?.products.includes(product.name)
  );

  return (
    <div className="products-page">
      <h1>Products and Services</h1>
      <div className="product-grid">
        {userProducts.map((product, index) => (
          <div key={index} className="product-card">
            <img src={product.image} alt={product.name} className="product-image" />
            <div className="product-content">
              <span className="product-icon">{product.icon}</span>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <button className="product-button">View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;
