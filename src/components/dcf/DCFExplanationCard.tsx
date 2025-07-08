import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, FileText, Globe, BarChart3, Sparkles } from 'lucide-react';

export const DCFExplanationCard: React.FC = () => {
  return (
    <Card className="mb-6 border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-slate-800">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Info className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-lg font-semibold">Mitä DCF-analyysi tekee?</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 mb-1">Analysoi tilinpäätökset</div>
                <div className="text-sm text-slate-600">Lukee 3-5 vuoden talousluvut ja tunnistaa trendit</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                <Globe className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 mb-1">Live markkinadata</div>
                <div className="text-sm text-slate-600">ECB, Eurostat ja Damodaran toimialatiedot</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 mb-1">3 skenaariota</div>
                <div className="text-sm text-slate-600">Pessimistinen, realistinen, optimistinen ennuste</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex-shrink-0">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-sm text-slate-700 leading-relaxed">
              <strong className="text-slate-800">DCF (Discounted Cash Flow)</strong> laskee yrityksen arvon tulevaisuuden kassavirtojen perusteella. 
              Claude Sonnet 4 analysoi tilinpäätöksesi, hakee live-markkinadataa ja luo 5 vuoden kassavirtaennusteet 
              kolmella eri skenaariolla. Tulos on <span className="font-medium text-blue-600">auditoitava ja perusteltu arvostus</span>.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};