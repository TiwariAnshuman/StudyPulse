
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Wait until session recovery is complete.
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-700">
        <div className="flex items-center gap-3 text-sm">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Checking your session...
        </div>
      </main>
    );
  }

  // Redirect unauthenticated users to login.
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Allow authenticated users to access the child route.
  return <Outlet />;
}
