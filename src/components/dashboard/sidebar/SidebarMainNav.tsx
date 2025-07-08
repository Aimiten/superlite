import { Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import SidebarNavItem from "./SidebarNavItem";
import { MAIN_NAV_ITEMS } from "./navigation-items";
import { useCompany } from "@/hooks/use-company";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarMainNavProps {
  collapsed: boolean;
}

const SidebarMainNav = ({ collapsed }: SidebarMainNavProps) => {
  const { toast } = useToast();
  const { hasCompany, loading, activeCompany } = useCompany();
  const location = useLocation();
  const [hasValuation, setHasValuation] = useState(false);
  
  // Check if company has valuation
  useEffect(() => {
    const checkValuation = async () => {
      if (!activeCompany?.id) {
        setHasValuation(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('valuations')
          .select('id')
          .eq('company_id', activeCompany.id)
          .limit(1);
        
        console.log('Checking valuations for company:', activeCompany.id);
        console.log('Valuation check result:', { data, error, hasValuation: data && data.length > 0 });
        
        setHasValuation(data && data.length > 0);
      } catch (error) {
        setHasValuation(false);
      }
    };
    
    checkValuation();
  }, [activeCompany]);

  const handleNotImplemented = (feature: string) => {
    toast({
      title: "Toimintoa ei ole vielä toteutettu",
      description: `${feature} tulee käyttöön myöhemmin.`,
      variant: "destructive",
    });
  };

  return (
    <div className="mt-6 px-3 flex-1 overflow-y-auto">
      <div className={!collapsed ? "mb-2 px-4 text-xs font-semibold text-slate-500" : "hidden"}>Toiminnot</div>
      
      {!hasCompany && !loading && !collapsed && (
        <div className="mb-4 mx-1 px-4 py-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 text-sm font-medium">Lisää ensin yritys</p>
              <p className="text-amber-700 text-xs mt-1">Lisää yrityksesi tiedot ennen työkalujen käyttöä</p>
              <Link to="/profile">
                <Button variant="outline" size="sm" className="mt-2 bg-white text-amber-700 border-amber-300 hover:bg-amber-50">
                  Siirry profiiliin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {!hasCompany && !loading && collapsed && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mb-4 mx-1 flex justify-center">
                <Link to="/profile">
                  <Button variant="outline" size="icon" className="bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100">
                    <AlertCircle className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" className="bg-amber-50 border-amber-200 text-amber-800">
              <p className="font-medium">Lisää yritys ennen jatkamista</p>
              <p className="text-xs text-amber-700">Klikkaa siirtyäksesi profiiliin</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <ul className="space-y-1">
        {MAIN_NAV_ITEMS.map((item) => {
          // Hide simulator if no valuation exists
          if (item.requiresValuation && !hasValuation) {
            return null;
          }
          
          return (
            <SidebarNavItem 
              key={item.path} 
              icon={item.icon}
              title={item.title}
              href={item.path}
              isActive={item.path === location.pathname || 
                (item.path !== "/" && location.pathname.startsWith(item.path))}
              disabled={!hasCompany && item.path !== "/dashboard" && item.path !== "/profile"}
            />
          );
        })}
      </ul>

      {!collapsed && (
        <div className="mt-6 bg-slate-50 p-4 rounded-lg hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Muut toiminnot</span>
          </div>
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm"
              onClick={() => handleNotImplemented("Käyttäjien hallinta")}
            >
              <Users className="h-4 w-4 mr-2 text-slate-600" />
              <span className="truncate">Käyttäjät</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarMainNav;
