import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import fetchProducts from '../api/fetchProducts';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [selectedProductUid, setSelectedProductUid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const inflightPromiseRef = useRef(null);

  const fetchProductsList = useCallback(async () => {
    // If a request is already inflight, return the same promise to deduplicate it
    if (inflightPromiseRef.current) {
      return inflightPromiseRef.current;
    }

    const promise = (async () => {
      setLoading(true);
      try {
        const data = await fetchProducts();
        if (data && !data.error) {
          setProducts(data);
          setError(null);
          return data;
        } else {
          setError(data?.error || "Error fetching products");
          return null;
        }
      } catch (err) {
        setError(err.message || "Error fetching products");
        return null;
      } finally {
        setLoading(false);
        inflightPromiseRef.current = null;
      }
    })();

    inflightPromiseRef.current = promise;
    return promise;
  }, []);

  // Fetch initial products list when provider mounts
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      fetchProductsList();
    }
  }, [fetchProductsList]);

  // Handle setting default selected product once products list loads
  useEffect(() => {
    if (products.length > 0 && !selectedProductUid) {
      const saved = localStorage.getItem("selectedProductUid") || products[0].uid;
      setSelectedProductUid(saved);
      localStorage.setItem("selectedProductUid", saved);
    }
  }, [products, selectedProductUid]);

  const selectProduct = (uid) => {
    setSelectedProductUid(uid);
    localStorage.setItem("selectedProductUid", uid);
  };

  const selectedProduct = products.find((p) => p.uid === selectedProductUid) || null;

  return (
    <ProductContext.Provider
      value={{
        products,
        setProducts,
        selectedProductUid,
        setSelectedProductUid: selectProduct,
        selectedProduct,
        loading,
        error,
        refetchProducts: fetchProductsList,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
