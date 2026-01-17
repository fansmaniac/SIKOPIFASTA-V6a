import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../modules/auth/Login";
import Register from "../modules/auth/Register";
import AdminPanel from "../modules/admin/AdminPanel";
import Dashboard from "../modules/user/Dashboard";
import RequireAuth from "../components/RequireAuth";
import RequireAdmin from "../components/RequireAdmin";
import { useAuth } from "../hooks/useAuth";

export default function App() {
 const { firebaseUser, isAdmin, loading, error, isActive } = useAuth();

  if (loading) return null;
  if (error) return <div>{error}</div>;
  if (firebaseUser && isActive === false) return <div>Akun Nonaktif</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={firebaseUser ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace /> : <Login />} />
        <Route path="/register" element={firebaseUser ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace /> : <Register />} />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminPanel />
              </RequireAdmin>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to={firebaseUser ? (isAdmin ? "/admin" : "/dashboard") : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
