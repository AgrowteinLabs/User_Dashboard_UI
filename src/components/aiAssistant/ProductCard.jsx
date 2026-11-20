import PropTypes from "prop-types";
import { MdInsights } from "react-icons/md";
import { motion } from "framer-motion";
import "./AiAssistant.scss";

const ProductCard = ({ product, onGenerate, isSelected }) => {
  const initial = (product.alias || product.name || product.uid || "P")[0].toUpperCase();

  return (
    <motion.div
      className={`ai-product-card ${isSelected ? "selected" : ""}`}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="card-top-row">
        <div className="card-avatar">{initial}</div>
        {product.type && <span className="card-type-tag">{product.type}</span>}
      </div>

      <div className="card-body">
        <h3 className="product-title" title={product.alias || product.name}>
          {product.alias || product.name}
        </h3>
        {product.uid && (
          <div className="product-uid-badge">
            <span className="uid-label">UID</span>
            <span className="uid-val">{product.uid}</span>
          </div>
        )}
      </div>

      <div className="card-footer">
        <motion.button
          className="generate-insights-btn"
          onClick={onGenerate}
          whileTap={{ scale: 0.96 }}
          aria-label="Generate AI Insights"
        >
          <MdInsights size={18} />
          <span>{isSelected ? "Regenerate Analysis" : "Analyze Farm"}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    alias: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    uid: PropTypes.string,
  }).isRequired,
  onGenerate: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
};

export default ProductCard;
