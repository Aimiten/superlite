import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface DCFProgressCardProps {
  analysisProgress: string;
  elapsedTime: number;
}

export const DCFProgressCard: React.FC<DCFProgressCardProps> = ({ 
  analysisProgress, 
  elapsedTime 
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Clock className="h-6 w-6 text-primary animate-spin" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-lg">DCF-analyysi käynnissä</div>
            <div className="text-sm text-muted-foreground mt-1">
              {analysisProgress || 'Claude analysoi tilinpäätöksiä ja laskee DCF-projektioita'}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Kulunut aika: {Math.floor(elapsedTime / 60)} min {String(elapsedTime % 60).padStart(2, '0')} sek
              {elapsedTime < 180 && ' • Arvioitu kesto: 3-5 minuuttia'}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min((elapsedTime / 300) * 100, 95)}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};