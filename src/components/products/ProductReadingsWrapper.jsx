import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import ProductReadings from "./ProductReadings";
import fetchProducts from "../../api/fetchProducts";

const ProductReadingsWrapper = () => {
  const { uid } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState(state?.product || null);
  const [loading, setLoading] = useState(!state?.product);

  useEffect(() => {
    if (!state?.product) {
      const fetchAndSetProduct = async () => {
        try {
          const data = await fetchProducts();
          const matched = data.find((p) => p.uid === uid);
          if (matched) {
            setProduct(matched);
          } else {
            console.warn("No product found with uid:", uid);
          }
        } catch (err) {
          console.error("Failed to fetch products", err);
        } finally {
          setLoading(false);
        }
      };
      fetchAndSetProduct();
    }
  }, [uid, state]);

  if (loading) return <div style={{ padding: "2rem" }}>Loading...</div>;

  if (!product || !product.uid) {
    return <div style={{ padding: "2rem", color: "red" }}>Product not found or missing UID.</div>;
  }

  return <ProductReadings product={product} onBack={() => navigate("/products")} />;
};

export default ProductReadingsWrapper;
