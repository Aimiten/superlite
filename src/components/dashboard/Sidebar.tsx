
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SidebarBranding from "./sidebar/SidebarBranding";
import SidebarMainNav from "./sidebar/SidebarMainNav";
import SidebarUtilityNav from "./sidebar/SidebarUtilityNav";
import SidebarToggle from "./sidebar/SidebarToggle";
import { MAIN_NAV_ITEMS, UTILITY_NAV_ITEMS } from "./sidebar/navigation-items";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
  const { user, signOut } = useAuth();
  const { hasCompany } = useCompany();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  // Update collapse state when props change
  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    if (onToggle) {
      onToggle();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Kirjauduttu ulos",
      description: "Olet kirjautunut ulos onnistuneesti.",
    });
    navigate("/auth");
  };

  // Update active state based on current path
  const updatedMainNavItems = MAIN_NAV_ITEMS.map(item => ({
    ...item,
    isActive: item.path === location.pathname || 
              (item.path !== "/" && location.pathname.startsWith(item.path)),
  }));

  // Add logout functionality to utility nav items
  const utilityNavItemsWithActions = UTILITY_NAV_ITEMS.map(item => {
    if (item.action === "logout") {
      return {
        ...item,
        onClick: handleSignOut
      };
    }
    return item;
  });

  return (
    <aside className={`bg-background h-screen flex flex-col border-r shadow-sm transition-all duration-300 ${
      isCollapsed ? "w-14 sm:w-16" : "w-52 sm:w-60"
    }`}>
      <SidebarBranding collapsed={isCollapsed} />
      
      <div className="flex-1 overflow-y-auto py-2 sm:py-4">
        <SidebarMainNav collapsed={isCollapsed} />
      </div>
      
      <div className="border-t">
        <SidebarUtilityNav collapsed={isCollapsed} />
        <SidebarToggle 
          collapsed={isCollapsed} 
          toggleCollapsed={handleToggle} 
          isMobile={isMobile} 
        />
      </div>
    </aside>
  );
};

export default Sidebar;
