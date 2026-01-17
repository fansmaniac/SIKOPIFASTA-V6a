import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RequireAuth({ children }) {
  const { loading, firebaseUser } = useAuth();

  if (loading) return null;
  if (!firebaseUser) return <Navigate to="/login" replace />;

  return children;
}
