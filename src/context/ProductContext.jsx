import React, { createContext, useState } from 'react';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [selectedProductUid, setSelectedProductUid] = useState(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);

  return (
    <ProductContext.Provider
      value={{
        selectedProductUid,
        setSelectedProductUid,
        selectedProductDetails,
        setSelectedProductDetails,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
