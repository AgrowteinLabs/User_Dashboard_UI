// src/components/aiAssistant/GroboLogo.jsx
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import groboImage from "../../assets/images/grobo-logo.png";

const GroboLogo = ({ size = 80 }) => {
  return (
    <motion.img
      src={groboImage}
      alt="Grobo"
      width={size}
      height={size}
      className="grobo-logo"
      animate={{ scale: [1, 1.1, 1], y: [0, -8, 0] }}
      transition={{
        repeat: Infinity,
        repeatType: "loop",
        duration: 2,
        ease: "easeInOut",
      }}
    />
  );
};

GroboLogo.propTypes = {
  size: PropTypes.number,
};

export default GroboLogo;
