import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RequireAdmin({ children }) {
  const { loading, isAdmin } = useAuth();

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}
