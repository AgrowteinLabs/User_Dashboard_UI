import { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import fetchProducts from "../../api/fetchProducts";
import ProductCard from "./ProductCard";
import "./ProductsPage.scss";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        if (data.error) {
          setError(data.error);
        } else {
          setProducts(data);
          setFilteredProducts(data);
        }
      } catch {
        setError("Failed to fetch products.");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredProducts(
      products.filter(
        (p) =>
          p.alias.toLowerCase().includes(term) ||
          p.uid.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, products]);

  return (
    <div className="products-page">
      {/* Header */}
      <div className="products-header">
        <div className="products-header-left">
          <h1 className="products-title">My Products</h1>
          <p className="products-subtitle">
            {products.length} device{products.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div className="products-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="products-search"
            type="text"
            placeholder="Search by name or UID…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="products-spinner">
          <CircularProgress sx={{ color: "var(--primary-color)" }} />
          <span>Loading devices…</span>
        </div>
      )}

      {error && !loading && (
        <div className="products-error">
          <span>⚠ {error}</span>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        filteredProducts.length > 0 ? (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.uid} product={product} />
            ))}
          </div>
        ) : (
          <div className="products-empty">
            <span className="empty-icon">📡</span>
            <p>No products found matching &quot;{searchTerm}&quot;</p>
          </div>
        )
      )}
    </div>
  );
};

export default ProductsPage;
