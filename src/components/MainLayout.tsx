import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Building2, BarChart2 } from "lucide-react";
import FeedbackButton from "@/components/feedback/FeedbackButton";

const MainLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  // Tarkista, onko kyseessä dashboard-reitti
  const isDashboard = location.pathname.includes("/dashboard") || 
                      location.pathname.includes("/assessment") ||
                      location.pathname.includes("/tasks") ||
                      location.pathname.includes("/valuation") ||
                      location.pathname.includes("/sharing") ||
                      location.pathname.includes("/sharing-manager") ||
                      location.pathname.includes("/profile") ||
                      location.pathname.includes("/task-generator") ||
                      location.pathname.includes("/ai-assistant") ||
                      location.pathname.includes("/help") ||
                      location.pathname.includes("/simulator") ||
                      location.pathname.includes("/dcf-analysis");

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Kirjauduttu ulos",
      description: "Olet kirjautunut ulos onnistuneesti.",
    });
    navigate("/auth");
  };

  // Dashboard-reiteillä annetaan sivukomponentin hoitaa layout (jos siellä on DashboardLayout)
  // MainLayout ei enää lisää omaa DashboardLayoutia
  if (isDashboard) {
    return (
      <>
        <Outlet />
        {user && <FeedbackButton />}
      </>
    );
  }

  // Muuten käytetään perus-layoutia (ei-dashboard sivuille)
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-3 md:py-4 px-3 sm:px-6 lg:px-8 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-1 md:gap-2 group">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-1.5 md:p-2 rounded-lg shadow-md transition-all duration-300 group-hover:shadow-lg">
              <div className="flex items-center text-white">
                <Building2 className="h-5 w-5 md:h-6 md:w-6 mr-0.5 md:mr-1" />
                <BarChart2 className="h-4 w-4 md:h-5 md:w-5" />
              </div>
            </div>
            <span className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-700">
              Arvonlaskuri
            </span>
          </Link>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="px-2 md:px-4 text-xs md:text-sm"
            >
              Kirjaudu ulos
            </Button>
          )}
        </div>
      </header>
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="py-3 md:py-4 px-3 sm:px-6 lg:px-8 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center text-slate-600 text-xs md:text-sm">
          <p>© {new Date().getFullYear()} Arvonlaskuri Työkalu</p>
        </div>
      </footer>
      {user && <FeedbackButton />}
    </div>
  );
};

export default MainLayout;