import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, BarChart2, Landmark, TrendingUp, FileBarChart } from "lucide-react";
import ValuationRangeChart from "./ValuationRangeChart";

interface ValuationCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
  subtext?: string;
}

/**
 * Yksittäinen kortti arvonmäärityksen tunnusluvulle
 */
const ValuationCard: React.FC<ValuationCardProps> = ({ 
  title, 
  value, 
  icon, 
  highlight = false, 
  subtext 
}) => {
  return (
    <div className={`p-4 rounded-lg border shadow-neumorphic ${highlight ? 'bg-primary/10 border-primary/20' : 'bg-background border-border'}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-full p-2 ${highlight ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className={`text-xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
      </div>
    </div>
  );
};

interface ValuationDashboardProps {
  companyName: string;
  companyType?: string;
  businessId?: string;
  valuationDate?: string;
  mostLikelyValue?: number;
  minValue?: number;
  maxValue?: number;
  bookValue?: number;
  netDebt?: number;
  ebitda?: number;
  ebit?: number;
  revenue?: number;
  netProfit?: number;
  methodsCount?: number;
}

/**
 * Yleisnäkymä yrityksen arvonmäärityksestä
 */
const ValuationDashboard: React.FC<ValuationDashboardProps> = ({
  companyName,
  companyType,
  businessId,
  valuationDate,
  mostLikelyValue = 0,
  minValue = 0,
  maxValue = 0,
  bookValue,
  netDebt,
  ebitda,
  ebit,
  revenue,
  netProfit,
  methodsCount = 0
}) => {
  // Format currency value with euro symbol
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return "Ei tietoa";

    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    };

    return new Intl.NumberFormat('fi-FI', options).format(value);
  };

  // Format date in Finnish format
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Ei päiväystä";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fi-FI');
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  return (
    <Card className="mb-6 overflow-hidden shadow-neumorphic">
      <div className="bg-primary p-6 text-primary-foreground">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold">{companyName || "Yritys"}</h2>
            <p className="text-primary-foreground/80">
              {companyType && `${companyType} • `}
              {businessId && `Y-tunnus: ${businessId}`}
            </p>
          </div>
          <Badge variant="outline" className="text-primary-foreground border-primary-foreground/50 bg-primary-foreground/10 h-6">
            Arvonmääritys {formatDate(valuationDate)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ValuationCard 
            title="Todennäköisin arvo" 
            value={formatCurrency(mostLikelyValue)}
            icon={<Scale size={18} />} 
            highlight={true}
          />
          <ValuationCard 
            title="Arvohaarukka" 
            value={`${formatCurrency(minValue)} - ${formatCurrency(maxValue)}`}
            icon={<BarChart2 size={18} />} 
          />
          <ValuationCard 
            title="Taseen oma pääoma" 
            value={formatCurrency(bookValue)}
            icon={<Landmark size={18} />} 
            subtext="Kirja-arvo"
          />
        </div>

        {/* Visuaalinen arvohaarukka */}
        <div className="mt-6 p-4 bg-muted rounded-lg shadow-neumorphic">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Arvohaarukka</h3>
          <ValuationRangeChart 
            min={minValue} 
            max={maxValue} 
            mostLikely={mostLikelyValue} 
            bookValue={bookValue}
          />
        </div>

        {/* Taloudelliset pääindikaattorit */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-muted rounded-lg shadow-neumorphic">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-medium text-muted-foreground">Liikevaihto</h3>
            </div>
            <p className="text-lg font-semibold mt-1">{formatCurrency(revenue)}</p>
          </div>

          <div className="p-3 bg-muted rounded-lg shadow-neumorphic">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-medium text-muted-foreground">EBITDA</h3>
            </div>
            <p className="text-lg font-semibold mt-1">{formatCurrency(ebitda)}</p>
          </div>

          <div className="p-3 bg-muted rounded-lg shadow-neumorphic">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-medium text-muted-foreground">EBIT</h3>
            </div>
            <p className="text-lg font-semibold mt-1">{formatCurrency(ebit)}</p>
          </div>

          <div className="p-3 bg-muted rounded-lg shadow-neumorphic">
            <div className="flex items-center gap-2">
              <FileBarChart size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-medium text-muted-foreground">Nettovelka</h3>
            </div>
            <p className="text-lg font-semibold mt-1">{formatCurrency(netDebt)}</p>
          </div>
        </div>

        {/* Info menetelmistä */}
        {methodsCount > 0 && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Perustuu {methodsCount} arvostusmenetelmään</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ValuationDashboard;