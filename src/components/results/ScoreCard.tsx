
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain } from "lucide-react";

interface ScoreCardProps {
  totalScore: number;
  scores: {
    documentation: number;
    process: number;
    financial: number;
    customers: number;
  };
}

const ScoreCard: React.FC<ScoreCardProps> = ({ totalScore, scores }) => {
  const getColorClass = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColorClass = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressBgColorClass = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'Erinomainen myyntikuntoisuus';
    if (score >= 60) return 'Hyvä myyntikuntoisuus, pienillä parannuksilla erinomaiseksi';
    if (score >= 40) return 'Tyydyttävä myyntikuntoisuus, vaatii kehittämistä';
    return 'Myyntikuntoisuus vaatii merkittävää kehittämistä';
  };

  return (
    <Card className="card-3d">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Kokonaisarvio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className={`text-5xl font-bold mb-2 ${getColorClass(totalScore)}`}>
            {totalScore}%
          </div>
          <p className="text-gray-500">
            {getScoreMessage(totalScore)}
          </p>
        </div>

        <div className="my-4 h-px bg-gray-200" />

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Dokumentaatio</span>
              <span className={`text-sm font-medium ${getColorClass(scores.documentation)}`}>
                {scores.documentation}%
              </span>
            </div>
            <Progress 
              value={scores.documentation} 
              indicatorClassName={getProgressColorClass(scores.documentation)}
              className={`h-2 ${getProgressBgColorClass(scores.documentation)}`}
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Prosessit</span>
              <span className={`text-sm font-medium ${getColorClass(scores.process)}`}>
                {scores.process}%
              </span>
            </div>
            <Progress 
              value={scores.process} 
              indicatorClassName={getProgressColorClass(scores.process)}
              className={`h-2 ${getProgressBgColorClass(scores.process)}`}
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Talous</span>
              <span className={`text-sm font-medium ${getColorClass(scores.financial)}`}>
                {scores.financial}%
              </span>
            </div>
            <Progress 
              value={scores.financial} 
              indicatorClassName={getProgressColorClass(scores.financial)}
              className={`h-2 ${getProgressBgColorClass(scores.financial)}`}
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Asiakkaat</span>
              <span className={`text-sm font-medium ${getColorClass(scores.customers)}`}>
                {scores.customers}%
              </span>
            </div>
            <Progress 
              value={scores.customers} 
              indicatorClassName={getProgressColorClass(scores.customers)}
              className={`h-2 ${getProgressBgColorClass(scores.customers)}`}
            />
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-600 italic">
            <span className="font-medium">Huomio:</span> Pisteytys perustuu annettuihin vastauksiin asteikolla 1-5, jossa vastaukselle 1 annetaan 0-20 pistettä, vastaukselle 2 annetaan 21-40 pistettä jne.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreCard;
