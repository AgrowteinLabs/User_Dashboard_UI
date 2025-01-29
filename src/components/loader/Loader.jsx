import React from "react";
import "./Loader.css";
import LogoLeaf from "./Logo Leaf.png"; // Import the image

const Loader = () => {
  return (
    <div className="loader-container">
      <img src={LogoLeaf} alt="Loading..." className="loader-image" />
      <p className="loader-text">Agrowtrack Loading, please wait...</p>
    </div>
  );
};

export default Loader;
