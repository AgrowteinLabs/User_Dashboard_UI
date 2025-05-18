import PropTypes from "prop-types";
import { Button, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleViewDataClick = () => {
    navigate(`/products/${product.uid}/data`, { state: { alias: product.alias } });
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "8px",
        p: 2,
        height: "180px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: 1,
      }}
    >
      <Typography variant="h6" fontWeight={600} color="primary" noWrap>
        {product.alias}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        UID: {product.uid}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Status: Unknown
      </Typography>
      <Button variant="contained" color="primary" fullWidth onClick={handleViewDataClick} sx={{ mt: 1 }}>
        View Data
      </Button>
    </Box>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    alias: PropTypes.string.isRequired,
  }).isRequired,
};

export default ProductCard;
