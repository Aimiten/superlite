import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { DCFStructuredData } from '@/types/dcf-analysis';

interface DCFHistoryItem {
  id: string;
  created_at: string;
  status: string;
  structured_data: DCFStructuredData | null;
  company_name: string;
}

interface DCFHistoryListProps {
  history: DCFHistoryItem[];
  onHistoryItemClick: (item: DCFHistoryItem) => void;
}

export const DCFHistoryList: React.FC<DCFHistoryListProps> = ({ 
  history, 
  onHistoryItemClick 
}) => {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Ei aiempia analyysejä</h3>
          <p className="text-muted-foreground">
            DCF-analyysit näkyvät täällä kun niitä on luotu
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <Card 
          key={item.id} 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => {
            // Only allow clicking on completed analyses with structured data
            if (item.status === 'completed' && item.structured_data) {
              onHistoryItemClick(item);
            }
          }}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-sm">
                  DCF-analyysi
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString('fi-FI')} {new Date(item.created_at).toLocaleTimeString('fi-FI')}
                </div>
                {item.structured_data?.valuation_summary && (
                  <div className="text-sm font-medium mt-2">
                    {formatCurrency(item.structured_data.valuation_summary.probability_weighted_valuation.weighted_equity_value)}
                  </div>
                )}
              </div>
              <Badge variant={
                item.status === 'completed' ? 'default' : 
                item.status === 'phase1_completed' ? 'secondary' :
                item.status === 'processing' ? 'outline' :
                'destructive'
              }>
                {item.status === 'phase1_completed' ? 'Vaihe 1 valmis' : item.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};