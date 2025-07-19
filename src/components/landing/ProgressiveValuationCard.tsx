import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Building2, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ProgressiveValuationCardProps {
  data: any;
  onCalculateClick: () => void;
}

interface LoadingStep {
  id: string;
  label: string;
  duration: number;
  status: 'waiting' | 'loading' | 'done' | 'error';
}

export function ProgressiveValuationCard({ data, onCalculateClick }: ProgressiveValuationCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const isFullDataLoaded = data.isFullDataLoaded;

  return (
    <Card className="shadow-neumorphic overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">{data.name}</h2>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>{data.businessId}</span>
              <span>•</span>
              <span>{data.businessLine || data.industry}</span>
              <span>•</span>
              <span>Perustettu {new Date(data.registrationDate).getFullYear()}</span>
              {data.employees && (
                <>
                  <span>•</span>
                  <span>{data.employees} työntekijää</span>
                </>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="shadow-sm">
            {data.companyAge} vuotta
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Company teaser from Gemini */}
        {data.teaser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-2"
          >
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-muted-foreground italic">{data.teaser}</p>
          </motion.div>
        )}

        {/* Financial data */}
        {data.revenue ? (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Liikevaihto</p>
              <p className="text-2xl font-bold">{formatCurrency(data.revenue)}</p>
            </div>
            {data.financialData?.revenue?.length > 1 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Kasvu</p>
                <p className="text-lg font-semibold text-green-600">
                  +{Math.round(((data.financialData.revenue[0].value - data.financialData.revenue[1].value) / data.financialData.revenue[1].value) * 100)}%
                </p>
              </div>
            )}
          </div>
        ) : (
          <Skeleton className="h-20 w-full" />
        )}

        {/* Valuation section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {isFullDataLoaded ? "Arvonmääritys" : "Alustava arvio"}
          </h3>

          {isFullDataLoaded ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Full valuation data */}
              <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Toimialan arvostus</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(data.calculations?.revenueValuations?.min || 0)} — {formatCurrency(data.calculations?.revenueValuations?.max || 0)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {data.multipliers?.revenue?.min}-{data.multipliers?.revenue?.max}x
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Perustuu: {data.multipliers?.revenue?.source || "Toimialan keskiarvo"}
                </p>

                {data.marketSituation && (
                  <div className="pt-4 border-t border-primary/10">
                    <p className="text-sm font-medium text-primary mb-1">Markkinatilanne:</p>
                    <p className="text-sm">{data.marketSituation}</p>
                  </div>
                )}
              </div>

              {/* What's missing */}
              <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div className="space-y-3">
                    <p className="font-semibold text-orange-900 dark:text-orange-100">
                      Tämä on vain lähtökohta
                    </p>
                    <div className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
                      <p>Täysi arvonmääritys sisältää:</p>
                      <ul className="space-y-1 ml-4">
                        <li>• Normalisoidut luvut (oikaisut)</li>
                        <li>• AI-avustaja kysyy tarkentavia tietoja</li>
                        <li>• Henkilökohtaiset kehityssuositukset</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            // Loading state with quick valuation
            <div className="space-y-4">
              {data.quickValuation && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Nopea arvio:</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(data.quickValuation.min)} — {formatCurrency(data.quickValuation.max)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ({data.quickValuation.multiplier} liikevaihdosta)
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                <span>Haetaan tarkempia tietoja...</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="bg-muted/30 p-6">
        <div className="w-full">
          {/* Arvolupaus - mitä saat 39€:lla */}
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg mb-4 border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
              <span className="text-lg">💎</span>
              Täysi arvonmääritys sisältää:
            </h4>
            <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>15-sivuinen PDF-raportti tulostettavassa muodossa</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Henkilökohtaiset suositukset arvon nostamiseen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>AI-avustaja vastaa kysymyksiisi 30 päivää</span>
              </li>
            </ul>
          </div>
          
          <Button
            onClick={onCalculateClick}
            size="lg"
            className="w-full shadow-neumorphic text-lg"
          >
            <span className="mr-2">💎</span>
            Aloita arvonmääritys 39€
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-3">
            30 päivän tyytyväisyystakuu • Turvallinen maksu
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}