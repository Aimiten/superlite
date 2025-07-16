import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import SidebarBranding from "./sidebar/SidebarBranding";
import SidebarMainNav from "./sidebar/SidebarMainNav";
import SidebarUtilityNav from "./sidebar/SidebarUtilityNav";
import { MAIN_NAV_ITEMS, UTILITY_NAV_ITEMS } from "./sidebar/navigation-items";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggle }) => {
  const { user, signOut } = useAuth();
  const { hasCompany } = useCompany();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Kirjauduttu ulos",
      description: "Olet kirjautunut ulos onnistuneesti.",
    });
    navigate("/auth");
  };

  // Käytä useMemo-hookia estämään tarpeeton uudelleenlaskenta
  const updatedMainNavItems = useMemo(() => {
    return MAIN_NAV_ITEMS.map(item => ({
      ...item,
      isActive: item.path === location.pathname || 
                (item.path !== "/" && location.pathname.startsWith(item.path)),
    }));
  }, [location.pathname]); // Laske uudelleen vain kun polku muuttuu

  // Käytä useMemo-hookia myös tälle
  const utilityNavItemsWithActions = useMemo(() => {
    return UTILITY_NAV_ITEMS.map(item => {
      if (item.action === "logout") {
        return {
          ...item,
          onClick: handleSignOut
        };
      }
      return item;
    });
  }, [handleSignOut]); // Riippuvuus vain handleSignOut

  return (
    <aside className="bg-background h-screen flex flex-col border-r shadow-neumorphic w-52 sm:w-60">
      <SidebarBranding collapsed={false} />
      <div className="flex-1 overflow-y-auto py-2 sm:py-4">
        <SidebarMainNav collapsed={false} navItems={updatedMainNavItems} />
      </div>
      <div className="border-t">
        <SidebarUtilityNav collapsed={false} navItems={utilityNavItemsWithActions} />
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);