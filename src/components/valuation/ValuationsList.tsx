
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart, Calendar, ArrowRight, DollarSign, RefreshCcw } from "lucide-react";

interface Valuation {
  id: string;
  company_name: string;
  created_at: string;
  results: any;
}

interface ValuationsListProps {
  valuations: Valuation[];
  isLoading: boolean;
  onSelect?: (valuation: Valuation) => void;
  showViewButton?: boolean;
  onRefresh?: () => Promise<void> | void;
}

const ValuationsList = ({ 
  valuations, 
  isLoading, 
  onSelect,
  showViewButton = false,
  onRefresh,
}: ValuationsListProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (valuations.length === 0) {
    return (
      <Card className="mb-4 bg-muted shadow-neumorphic">
        <CardContent className="p-6 text-center">
          <p className="text-base text-muted-foreground">Ei vielä arvonmäärityksiä.</p>
          {onRefresh && (
            <Button 
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="mt-4 flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Päivitä
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fi-FI');
  };

  // Funktio yrityksen arvon muotoiluun
  const formatCompanyValue = (value: any): string => {
    if (!value) return "Ei tiedossa";
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) return "Ei tiedossa";
    
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}M€`;
    } else if (numValue >= 1000) {
      return `${Math.round(numValue / 1000)}k€`;
    } else {
      return `${numValue}€`;
    }
  };

  return (
    <div className="space-y-4">
      {onRefresh && (
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Päivitä
          </Button>
        </div>
      )}
      {valuations.map((valuation) => (
        <Card 
          key={valuation.id} 
          className="hover:border-primary/30 transition-all cursor-pointer shadow-neumorphic hover:shadow-neumorphic-pressed"
          onClick={() => onSelect && onSelect(valuation)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-primary/20 p-2 rounded-full mr-4">
                  <FileBarChart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-medium">{valuation.company_name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {formatDate(valuation.created_at)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {valuation.results && valuation.results.most_likely_value && (
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-foreground">
                      {formatCompanyValue(valuation.results.most_likely_value)}
                    </div>
                    <div className="text-xs text-muted-foreground">Todennäköinen arvo</div>
                  </div>
                )}
                
                {showViewButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80 hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/valuation?id=${valuation.id}`);
                    }}
                  >
                    Tarkastele <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ValuationsList;
