import { useState, useEffect } from "react";
import { TextField, Typography, Grid, CircularProgress, Box } from "@mui/material";
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
      } catch (err) {
        setError("Failed to fetch products.");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = products.filter(
      (p) => p.alias.toLowerCase().includes(term) || p.uid.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error" align="center" mt={2}>{error}</Typography>;
  }

  return (
    <Box p={2}>
      <Typography variant="h4" align="center" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
        Available Products
      </Typography>

      <Box display="flex" justifyContent="center" mb={2}>
        <TextField
          label="Search by Alias or UID"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ width: "100%", maxWidth: 400 }}
        />
      </Box>

      <Grid container spacing={2} justifyContent="center">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.uid}>
              <ProductCard product={product} />
            </Grid>
          ))
        ) : (
          <Typography align="center" color="text.secondary" mt={4}>
            No products found.
          </Typography>
        )}
      </Grid>
    </Box>
  );
};

export default ProductsPage;
