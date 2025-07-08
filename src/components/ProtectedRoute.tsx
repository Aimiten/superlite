
import { useEffect } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompany?: boolean;
}

const ProtectedRoute = ({ children, requireCompany = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasCompany, loading: companyLoading } = useCompany();
  const location = useLocation();
  const isProfilePage = location.pathname === "/profile";
  const isDashboardPage = location.pathname === "/dashboard";

  useEffect(() => {
    console.log("Protected route - User:", user?.id);
    console.log("Protected route - hasCompany:", hasCompany, "requireCompany:", requireCompany);
    console.log("Protected route - Current path:", location.pathname);
    console.log("Protected route - Loading states:", { authLoading, companyLoading });
  }, [user, hasCompany, requireCompany, location.pathname, authLoading, companyLoading]);

  // Add global error handler
  useEffect(() => {
    const handleUnhandledErrors = (event: ErrorEvent) => {
      console.error("Unhandled error caught in ProtectedRoute:", event.error);
    };

    window.addEventListener('error', handleUnhandledErrors);
    
    return () => {
      window.removeEventListener('error', handleUnhandledErrors);
    };
  }, []);

  // Näytetään latausanimaatio kun tarkistetaan kirjautumistilaa tai yritysten latauksen aikana
  if (authLoading || (requireCompany && companyLoading)) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Ohjataan kirjautumissivulle, jos käyttäjä ei ole kirjautunut
  if (!user) {
    console.log("Protected route - User not logged in, redirecting to /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Tarkistetaan uudelleenohjaustarve:
  // 1. Jos yritys vaaditaan (requireCompany=true)
  // 2. JA käyttäjällä ei ole yritystä (hasCompany=false)
  // 3. JA emme ole jo profiilisivulla tai dashboardilla
  // 4. JA data on varmasti ladattu loppuun (companyLoading=false)
  // Lisäksi loggaamme selkeästi miksi uudelleenohjaus tapahtuu
  if (requireCompany && !hasCompany && !isProfilePage && !isDashboardPage && !companyLoading) {
    console.log("Protected route - REDIRECTING TO PROFILE:");
    console.log("- Company required:", requireCompany);
    console.log("- Has company:", hasCompany);
    console.log("- Company loading:", companyLoading);
    console.log("- Current path:", location.pathname);
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }

  // Tarkistetaan erikseen, ettemme päädy loputtomaan uudelleenohjauskehään
  if (location.state?.from?.pathname === location.pathname) {
    console.log("Protected route - Avoiding redirect loop, rendering children");
    return <>{children}</>;
  }

  // Wrap children in an error boundary
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Error rendering protected content:", error);
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Virhe sovelluksessa</h2>
        <p className="text-center mb-6">Sovelluksessa tapahtui virhe. Yritä päivittää sivu.</p>
        <Link 
          to="/dashboard" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Palaa etusivulle
        </Link>
      </div>
    );
  }
};

export default ProtectedRoute;
