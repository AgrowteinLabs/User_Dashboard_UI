import React, { createContext, useState } from 'react';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [selectedProductUid, setSelectedProductUid] = useState(null);

  return (
    <ProductContext.Provider value={{ selectedProductUid, setSelectedProductUid }}>
      {children}
    </ProductContext.Provider>
  );
};
