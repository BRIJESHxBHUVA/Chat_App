import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requireAuth = false }) => {
  const accessToken = useSelector((state) => state.auth.accessToken);

  // Case 1: Page requires auth but user is not logged in
  if (requireAuth && !accessToken) {
    return <Navigate to="/" replace />;
  }

  // Case 2: Page is public (like login) but user is already logged in
  if (!requireAuth && accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise, render the page
  return children;
};

export default ProtectedRoute;
