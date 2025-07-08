
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-white">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={`${isMobile ? 'fixed' : 'hidden'} top-4 left-4 z-50 h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-sm bg-white/80 backdrop-blur-sm`}
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
        <Sidebar 
          collapsed={isMobile ? false : !sidebarOpen} 
          onToggle={toggleSidebar} 
        />
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
        className="flex-1 overflow-y-auto"
      >
        <div className={`px-3 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto ${isMobile ? 'pt-14 sm:pt-16' : ''}`}>
          {(showBackButton || pageTitle) && (
            <div className="mb-4 sm:mb-6">
              {showBackButton && (
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Takaisin etusivulle
                  </Button>
                </Link>
              )}
              
              {pageTitle && (
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{pageTitle}</h1>
                  {pageDescription && <p className="text-sm sm:text-base text-slate-500">{pageDescription}</p>}
                </div>
              )}
            </div>
          )}
          
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardLayout;
