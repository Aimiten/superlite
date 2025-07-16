import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, FileText, Globe, BarChart3, Sparkles } from 'lucide-react';

export const DCFExplanationCard: React.FC = () => {
  return (
    <Card className="mb-6 border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold">Mitä DCF-analyysi tekee?</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-4 border">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold mb-1">Analysoi tilinpäätökset</div>
                <div className="text-sm text-muted-foreground">Lukee 3-5 vuoden talousluvut ja tunnistaa trendit</div>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-4 border">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold mb-1">Live markkinadata</div>
                <div className="text-sm text-muted-foreground">ECB, Eurostat ja Damodaran toimialatiedot</div>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-4 border">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold mb-1">3 skenaariota</div>
                <div className="text-sm text-muted-foreground">Pessimistinen, realistinen, optimistinen ennuste</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-accent rounded-xl p-4 border">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm leading-relaxed">
              <strong>DCF (Discounted Cash Flow)</strong> laskee yrityksen arvon tulevaisuuden kassavirtojen perusteella. 
              Claude Sonnet 4 analysoi tilinpäätöksesi, hakee live-markkinadataa ja luo 5 vuoden kassavirtaennusteet 
              kolmella eri skenaariolla. Tulos on <span className="font-medium text-primary">auditoitava ja perusteltu arvostus</span>.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};