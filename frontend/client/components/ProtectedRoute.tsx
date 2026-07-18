import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, requireAdmin = false, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated && !accessToken) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role?.toUpperCase() !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.some(r => r.toLowerCase() === user?.role?.toLowerCase())) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
