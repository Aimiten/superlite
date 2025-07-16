// src/components/dashboard/sidebar/SidebarUtilityNav.tsx
import SidebarUtilityItem from "./SidebarUtilityItem";
import SidebarUserInfo from "./SidebarUserInfo";
import { UTILITY_NAV_ITEMS } from "./navigation-items";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SidebarUtilityNavProps {
  collapsed: boolean; // Tästä voidaan luopua myöhemmin kun collapsed poistetaan kokonaan
}

const SidebarUtilityNav = ({ collapsed }: SidebarUtilityNavProps) => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Kirjauduttu ulos",
      description: "Olet kirjautunut ulos onnistuneesti.",
    });
    navigate("/auth");
  };

  return (
    <div className="mt-auto p-3 border-t border-border">
      <div className="space-y-1">
        {/* Käyttäjätiedot näytetään aina, riippumatta collapsed-tilasta */}
        <SidebarUserInfo />

        {/* Varsinaiset navigaatio-itemit */}
        {UTILITY_NAV_ITEMS.map((item) => (
          <SidebarUtilityItem 
            key={item.title} 
            icon={item.icon}
            title={item.title}
            href={item.action ? undefined : item.path}
            onClick={item.action === "logout" ? handleSignOut : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default SidebarUtilityNav;