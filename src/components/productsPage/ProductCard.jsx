import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import "./ProductsPage.scss";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleOpen = () => {
    navigate(`/products/${product.uid}/data`, { state: { alias: product.alias } });
  };

  const initial = (product.alias || product.uid)[0].toUpperCase();

  return (
    <div
      className="product-card"
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleOpen()}
    >
      <div className="product-card-glow" />

      <div className="product-card-header">
        <div className="product-avatar">{initial}</div>
        <div className="product-status-dot" title="Active" />
      </div>

      <div className="product-card-body">
        <h3 className="product-alias">{product.alias}</h3>
        <p className="product-uid">
          <span className="uid-label">UID</span>
          <span className="uid-value">{product.uid}</span>
        </p>
      </div>

      <div className="product-card-footer">
        <button className="product-open-btn" onClick={handleOpen} tabIndex={-1}>
          View Analytics →
        </button>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    alias: PropTypes.string.isRequired,
  }).isRequired,
};

export default ProductCard;
