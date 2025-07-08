// src/components/ProtectedRoute.tsx

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompany?: boolean;
}

const ProtectedRoute = ({ children, requireCompany = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const {
    hasCompany,
    loading: companyLoading,
    dataFetched: companyDataFetched,
  } = useCompany();

  const location = useLocation();

  // 1. Näytetään spinner, jos Auth lataa tai (vaaditaan yritys & se yhä latautuu)
  if (authLoading || (requireCompany && companyLoading)) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // 2. Jos käyttäjää ei ole, ohjataan /auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. Jos vaaditaan yritys, data on fetched mutta ei löytynyt yhtään -> ohjaa /profile
  if (requireCompany && companyDataFetched && !hasCompany) {
    // Vältetään loop: jos jo /profile, ei ohjata
    if (location.pathname !== "/profile" && location.pathname !== "/dashboard") {
      return <Navigate to="/profile" state={{ from: location }} replace />;
    }
  }

  // 4. Muutoin renderöidään lapsikomponentit
  return <>{children}</>;
};

export default ProtectedRoute;
