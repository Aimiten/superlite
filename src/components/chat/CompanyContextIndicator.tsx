// src/components/chat/CompanyContextIndicator.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Building2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CompanyContext } from "./types";

interface CompanyContextIndicatorProps {
  companyContext: CompanyContext | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const CompanyContextIndicator: React.FC<CompanyContextIndicatorProps> = ({
  companyContext,
  isLoading,
  onRefresh
}) => {
  if (!companyContext) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 bg-muted/40 rounded-full">
        <Building2 className="h-3.5 w-3.5" />
        <span>Ei yritystietoja</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRefresh}
          disabled={isLoading}
          className="h-6 ml-0.5 text-xs px-1.5"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Lataa</span>
        </Button>
      </div>
    );
  }

  const companyName = companyContext.companyData?.name || "Yritys";
  const lastUpdated = companyContext.lastUpdated;

  // Format the date for display
  const formatDate = (date: Date) => {
    // Check if it's today
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && 
                   date.getMonth() === today.getMonth() && 
                   date.getFullYear() === today.getFullYear();

    // Format time
    const time = date.toLocaleTimeString('fi-FI', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (isToday) {
      return `tänään klo ${time}`;
    } else {
      return date.toLocaleDateString('fi-FI', {
        day: '2-digit',
        month: '2-digit'
      }) + ` klo ${time}`;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-full cursor-default">
            <Building2 className="h-3.5 w-3.5" />
            <span className="font-medium">{companyName}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefresh}
              disabled={isLoading}
              className="h-6 ml-0.5 text-xs px-1.5"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Päivitä tiedot</span>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tiedot päivitetty: {formatDate(lastUpdated)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CompanyContextIndicator;