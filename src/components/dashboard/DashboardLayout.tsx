import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

// Lisää tämä vakio localStorage-avainta varten
const SIDEBAR_STATE_KEY = "dashboard-sidebar-open";

interface DashboardLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  pageTitle?: string;
  pageDescription?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  showBackButton = false,
  pageTitle,
  pageDescription
}) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isAIAssistant = location.pathname.includes("/ai-assistant");

  // Käytä localStorage:a alustusvaiheessa
  const initialSidebarState = () => {
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    return savedState !== null ? JSON.parse(savedState) : !isMobile;
  };

  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarState);

  // Tallenna tila aina kun se muuttuu
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Vastaa vain näytön koon muutoksiin, ei aina render-vaiheessa
  useEffect(() => {
    const handleResize = () => {
      // Älä päivitä tilaa, jos se ei todella muutu
      if (isMobile && sidebarOpen) {
        setSidebarOpen(false);
      } else if (!isMobile && !sidebarOpen && !localStorage.getItem(SIDEBAR_STATE_KEY)) {
        // Käytä localStorage-tarkistusta estämään turhia päivityksiä
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-white">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={`${isMobile ? 'fixed' : 'hidden'} top-4 left-4 z-50 h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-neumorphic bg-white/80 backdrop-blur-sm`}
      >
        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar container with responsive positioning */}
      <div 
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-40' : 'relative'} 
          ${!sidebarOpen && isMobile ? '-translate-x-full' : 'translate-x-0'} 
          transition-transform duration-300 ease-in-out
        `}
      >
        <Sidebar onToggle={toggleSidebar} />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Main content area with responsive padding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`flex-1 ${isAIAssistant ? 'flex flex-col h-full overflow-hidden' : 'overflow-y-auto'}`}
      >
        {/* AI-assistantille ei paddingeja, jotta chat täyttää koko tilan */}
        <div className={`${isAIAssistant ? 'flex flex-col h-full w-full p-0 overflow-hidden' : 'px-3 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto'} 
          ${isMobile && !isAIAssistant ? 'pt-14 sm:pt-16' : ''}`}
        >
          {(showBackButton || pageTitle) && !isAIAssistant && (
            <div className="mb-4 sm:mb-6">
              {showBackButton && (
                <div className="flex items-center justify-between mb-4">
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Takaisin etusivulle
                    </Button>
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {location.pathname.includes("/profile") && "Profiili"}
                    {location.pathname.includes("/assessment") && "Arviointi"}
                    {location.pathname.includes("/tasks") && "Tehtävät"}
                    {location.pathname.includes("/task-generator") && "Tehtävägeneraattori"}
                    {location.pathname.includes("/valuation") && "Arvonmääritys"}
                    {location.pathname.includes("/sharing") && !location.pathname.includes("/sharing-manager") && "Jakaminen"}
                    {location.pathname.includes("/sharing-manager") && "Jakamisen hallinta"}
                  </div>
                </div>
              )}

              {pageTitle && (
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{pageTitle}</h1>
                  {pageDescription && <p className="text-sm sm:text-base text-slate-500">{pageDescription}</p>}
                </div>
              )}
            </div>
          )}

          {/* Käyttää suoraan children ilman mitään käärettä kun ollaan AI-assistantissa */}
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardLayout;