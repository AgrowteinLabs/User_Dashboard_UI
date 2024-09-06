import React, { useContext } from 'react';
import { ProductContext } from './ProductContext';

const ProductSelection = () => {
  const { setSelectedProductUid } = useContext(ProductContext);

  // Handle product selection and set the selected UID
  const handleProductSelect = (uid) => {
    setSelectedProductUid(uid); // Update context with the selected product UID
  };

  return (
    <div>
      <h4>Select a Product:</h4>
      <button onClick={() => handleProductSelect('avi001')}>Select Product 1 (avi001)</button>
      <button onClick={() => handleProductSelect('avi002')}>Select Product 2 (avi002)</button>
    </div>
  );
};

export default ProductSelection;
