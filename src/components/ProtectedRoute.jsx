import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    // If no userId found, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the child component
  return children;
};

export default ProtectedRoute;
