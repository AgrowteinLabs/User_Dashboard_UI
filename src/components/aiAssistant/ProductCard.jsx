import PropTypes from "prop-types";
import { MdInsights } from "react-icons/md";
import { motion } from "framer-motion";
import "./AiAssistant.scss";

const ProductCard = ({ product, onGenerate }) => {
  return (
    <motion.div
      className="product-card enhanced"
      whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="product-card-header">
        <h3
          className="product-title"
          aria-label={`Product ${product.alias || product.name}`}
        >
          {product.alias || product.name}
        </h3>

        {product.type && (
          <p className="product-type">
            <span className="label">Type:</span> {product.type}
          </p>
        )}

        {/* {product.uid && (
          <p className="product-uid">
            <span className="label">UID:</span> {product.uid}
          </p>
        )} */}
      </div>

      <div className="product-card-actions">
        <motion.button
          className="generate-btn"
          onClick={onGenerate}
          whileTap={{ scale: 0.95 }}
          whileHover={{
            backgroundColor: "#059669",
            transition: { duration: 0.2 },
          }}
          aria-label="Generate Insight"
        >
          <MdInsights size={20} className="icon" />
          <span>Generate Insight</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    alias: PropTypes.string,
    name: (props, propName, componentName) => {
      if (!props.alias && !props.name) {
        return new Error(
          `One of 'alias' or 'name' is required in '${componentName}'.`
        );
      }
      return null;
    },
    type: PropTypes.string,
    uid: PropTypes.string,
  }).isRequired,
  onGenerate: PropTypes.func.isRequired,
};

export default ProductCard;
