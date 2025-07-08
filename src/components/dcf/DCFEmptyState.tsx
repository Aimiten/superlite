import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, Plus } from 'lucide-react';

interface DCFEmptyStateProps {
  onStartAnalysis: () => void;
  isAnalyzing: boolean;
  hasValuation: boolean;
}

export const DCFEmptyState: React.FC<DCFEmptyStateProps> = ({ 
  onStartAnalysis, 
  isAnalyzing, 
  hasValuation 
}) => {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Aloita ensimmäinen DCF-analyysi</h3>
        <p className="text-gray-600 mb-6">
          DCF-analyysi luo yksityiskohtaisen kassavirtaennusteen ja laskee yrityksen arvon 
          kolmella eri skenaariolla. Analyysi perustuu tilinpäätöstietoihisi ja live-markkinadataan.
        </p>
        <div className="grid md:grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-semibold mb-1">📊 Mitä saat</div>
            <div className="text-gray-600">5 vuoden kassavirtaennusteet, WACC-laskelmat, terminaaliarvot</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-semibold mb-1">⏱️ Kesto</div>
            <div className="text-gray-600">3-5 minuuttia automatisoidussa analyysissä</div>
          </div>
        </div>
        <Button 
          onClick={onStartAnalysis}
          disabled={isAnalyzing || !hasValuation}
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Aloita DCF-analyysi
        </Button>
      </CardContent>
    </Card>
  );
};