
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface SidebarToggleProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
  isMobile: boolean;
}

const SidebarToggle = ({ collapsed, toggleCollapsed, isMobile }: SidebarToggleProps) => {
  return (
    <>
      {isMobile ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 h-7 w-7 sm:h-8 sm:w-8"
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="icon"
          onClick={toggleCollapsed}
          className="absolute -right-3 top-12 h-6 w-6 rounded-full border shadow-sm z-10 bg-white hidden sm:flex sm:items-center sm:justify-center"
        >
          {collapsed ? 
            <ChevronRight className="h-3 w-3" /> : 
            <ChevronLeft className="h-3 w-3" />
          }
        </Button>
      )}
    </>
  );
};

export default SidebarToggle;
