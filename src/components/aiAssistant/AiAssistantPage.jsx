import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import fetchProducts from "../../api/fetchProducts";
import ProductCard from "./ProductCard";
import ReportDisplay from "./ReportDisplay";
import ChatBot from "./ChatBot";
import "./AiAssistant.scss";
import { UserContext } from "../../context/UserContext";
import GroboLogo from "./GroboLogo";
import groboLogo from "../../assets/images/grobo-logo.png";

const AiAssistantPage = () => {
  useContext(UserContext); // FIX: Destructure user from context
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const getProducts = async () => {
      try {
        // If fetchProducts needs user info, pass it here (e.g., user?.uid)
        const result = await fetchProducts();
        setProducts(result);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("⚠️ Unable to load your products. Please try again later.");
      }
    };

    getProducts();
  }, []);

  const generateReport = async (uid) => {
    setLoadingReport(true);
    setError("");
    setSelectedProduct(uid);

    try {
      const res = await axios.post(
        `https://apiv2.agrowtein.com/api/v1/bot/report/${uid}`
      );
      setReport(res.data.report);
    } catch (err) {
      console.error("Error fetching report:", err);
      setError("⚠️ Failed to generate report. Please try again.");
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="ai-assistant-page">
      <motion.header
        className="welcome-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-logo-wrapper">
          <GroboLogo size={50} />
          <h2>
            👋 Welcome to{" "}
            <span className="highlight">Grobo - The Ai Assistant </span>
          </h2>
        </div>
        <p className="subtitle">
          Your smart AI assistant for precision farming insights.
        </p>
      </motion.header>

      <section className="product-list">
        <motion.h3
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Select a Product to Analyze
        </motion.h3>

        <div className="product-cards">
  {products.length > 0 ? (
    products.map((product, i) => {
  if ((!product?.name && !product?.alias) || !product?.uid) {
    console.warn("Skipping invalid product:", product);
    return null;
  }

  return (
    <motion.div
      key={product.uid}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + i * 0.1 }}
    >
      <ProductCard
        product={product}
        onGenerate={() => generateReport(product.uid)}
      />
    </motion.div>
  );
})

  ) : (
    <p className="no-products-msg">No products found in your account.</p>
  )}
</div>

      </section>

      {loadingReport && (
        <motion.div
          className="grobo-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.img
            src={groboLogo}
            alt="Grobo logo"
            className="grobo-logo"
            animate={{
              scale: [1, 1.1, 1],
              filter: [
                "drop-shadow(0 0 0px #00ff88)",
                "drop-shadow(0 0 10px #00ff88)",
                "drop-shadow(0 0 0px #00ff88)",
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.p
            className="grobo-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            🌱 Grobo is crunching the data for smart farming insights…
          </motion.p>
        </motion.div>
      )}

      {error && (
        <motion.p
          className="error-msg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}

      {report && (
        <>
          <ReportDisplay report={report} uid={selectedProduct} />
          <ChatBot uid={selectedProduct} />
        </>
      )}
    </div>
  );
};

export default AiAssistantPage;
