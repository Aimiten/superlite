
import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, FileText, Users, BarChart3, ShoppingCart, Lightbulb, AlertTriangle, ThumbsUp } from "lucide-react";

type Recommendation = {
  category: string;
  title: string;
  description: string;
  priority?: "korkea" | "keskitaso" | "matala";
  expected_impact?: string;
};

interface RecommendationsCardProps {
  recommendations: Recommendation[];
}

const RecommendationsCard: React.FC<RecommendationsCardProps> = ({ recommendations }) => {
  const getCategoryColorClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'documentation':
      case 'dokumentaatio':
        return 'bg-purple-100 text-purple-700';
      case 'process':
      case 'prosessit':
        return 'bg-green-100 text-green-700';
      case 'financial':
      case 'talous':
        return 'bg-blue-100 text-blue-700';
      case 'customers':
      case 'asiakkaat':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'documentation':
      case 'dokumentaatio':
        return <FileText className="h-5 w-5" />;
      case 'process':
      case 'prosessit':
        return <Users className="h-5 w-5" />;
      case 'financial':
      case 'talous':
        return <BarChart3 className="h-5 w-5" />;
      case 'customers':
      case 'asiakkaat':
        return <ShoppingCart className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getPriorityIcon = (priority?: string) => {
    if (!priority) return null;
    
    switch (priority.toLowerCase()) {
      case 'korkea':
        return <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />;
      case 'keskitaso':
        return <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />;
      case 'matala':
        return <ThumbsUp className="h-4 w-4 text-green-500 ml-2" />;
      default:
        return null;
    }
  };

  const getPriorityLabel = (priority?: string) => {
    if (!priority) return null;
    
    const colorClass = priority.toLowerCase() === 'korkea' 
      ? 'bg-red-100 text-red-700' 
      : priority.toLowerCase() === 'keskitaso'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-green-100 text-green-700';
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colorClass} ml-2`}>
        {priority}
      </span>
    );
  };

  return (
    <Card className="card-3d">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          Kehitysehdotukset
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length > 0 ? (
          <div className="space-y-6">
            {recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
                  <div 
                    className={`
                      rounded-lg w-12 h-12 flex items-center justify-center shrink-0
                      ${getCategoryColorClass(recommendation.category)}
                    `}
                  >
                    {getCategoryIcon(recommendation.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-semibold text-lg">{recommendation.title}</h3>
                      {getPriorityLabel(recommendation.priority)}
                    </div>
                    <p className="text-gray-600 mt-1">{recommendation.description}</p>
                    
                    {recommendation.expected_impact && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100 text-sm text-blue-700">
                        <strong>Odotettu vaikutus:</strong> {recommendation.expected_impact}
                      </div>
                    )}
                  </div>
                </div>
                {index < recommendations.length - 1 && <Separator className="my-4" />}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Yrityksesi myyntikuntoisuus on erinomaisella tasolla! Jatka samaan malliin.</p>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-purple-50 rounded-2xl border border-purple-100">
          <p className="text-sm text-purple-800">
            <span className="font-semibold">Tekoälyanalyysi:</span> Tämä arviointi on luotu yhdistämällä useiden 
            tekoälymallien (Perplexity, Gemini) analyysiä yrityksestäsi. Kehitysehdotukset perustuvat sekä antamiisi 
            tietoihin että tekoälyn laskemiin taloudellisiin tunnuslukuihin ja toimiala-analyysiin.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationsCard;
