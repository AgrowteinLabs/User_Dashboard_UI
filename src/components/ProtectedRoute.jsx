import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

const ProtectedRoute = ({ children }) => {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    // If no userId found, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the child component
  return children;
};
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;

