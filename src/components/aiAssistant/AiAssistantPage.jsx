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
import { MdAutoAwesome, MdSensors } from "react-icons/md";

const AiAssistantPage = () => {
  useContext(UserContext);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const getProducts = async () => {
      try {
        const result = await fetchProducts();
        setProducts(result || []);
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
    setReport(null);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/bot/report/${uid}`,
        {},
        { withCredentials: true }
      );
      setReport(res.data?.report);
    } catch (err) {
      console.error("Error fetching report:", err);
      setError("⚠️ Failed to generate AI report. Please check if the device has telemetry data.");
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="ai-assistant-page">
      {/* ── Hero Welcome Banner ─────────────────────── */}
      <motion.header
        className="welcome-hero-card"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="hero-content">
          <div className="hero-badge">
            <MdAutoAwesome /> Precision Agriculture Intelligence
          </div>
          <h1 className="hero-title">
            Meet <span className="highlight">Grobo</span> — Your AI Farm Advisor
          </h1>
          <p className="hero-subtitle">
            Autonomous data analytics, growth optimization insights, and real-time telemetry diagnostics powered by AI.
          </p>
        </div>

        <div className="hero-logo-box">
          <GroboLogo size={74} />
        </div>
      </motion.header>

      {/* ── Product Selection Section ───────────────── */}
      <section className="ai-products-section">
        <div className="section-title-bar">
          <div className="title-wrap">
            <MdSensors className="section-icon" />
            <h2>Select a Connected Farm Device</h2>
          </div>
          <span className="section-count">{products.length} device{products.length !== 1 ? "s" : ""} available</span>
        </div>

        <div className="ai-products-grid">
          {products.length > 0 ? (
            products.map((product, i) => {
              if ((!product?.name && !product?.alias) || !product?.uid) {
                return null;
              }

              return (
                <motion.div
                  key={product.uid}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                >
                  <ProductCard
                    product={product}
                    isSelected={selectedProduct === product.uid}
                    onGenerate={() => generateReport(product.uid)}
                  />
                </motion.div>
              );
            })
          ) : (
            <div className="no-products-box">
              <p>No registered devices found in your farm account.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Loading Animation ───────────────────────── */}
      {loadingReport && (
        <motion.div
          className="grobo-analyzing-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="orbital-loader">
            <div className="orbital-ring ring-1" />
            <div className="orbital-ring ring-2" />
            <img
              src={groboLogo}
              alt="Grobo AI"
              className="analyzing-logo"
            />
          </div>

          <div className="analyzing-text">
            <h3>Grobo is Analyzing Farm Telemetry…</h3>
            <p>Evaluating multi-sensor historical trends, micro-climate stability, and nutrient absorption ranges.</p>
          </div>
        </motion.div>
      )}

      {/* ── Error Banner ────────────────────────────── */}
      {error && !loadingReport && (
        <motion.div
          className="ai-error-banner"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>{error}</span>
        </motion.div>
      )}

      {/* ── Generated Report & Interactive Chat ──────── */}
      {report && (
        <div className="ai-results-wrapper">
          <ReportDisplay report={report} uid={selectedProduct} />
          <ChatBot uid={selectedProduct} />
        </div>
      )}
    </div>
  );
};

export default AiAssistantPage;
