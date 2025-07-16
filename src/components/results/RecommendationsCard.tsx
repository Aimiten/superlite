
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
        return 'bg-[hsl(var(--chart-1))]/10 text-[hsl(var(--chart-1))]/80';
      case 'process':
      case 'prosessit':
        return 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]/80';
      case 'financial':
      case 'talous':
        return 'bg-[hsl(var(--chart-2))]/10 text-[hsl(var(--chart-2))]/80';
      case 'customers':
      case 'asiakkaat':
        return 'bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))]/80';
      default:
        return 'bg-muted text-foreground/80';
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
        return <AlertTriangle className="h-4 w-4 text-destructive ml-2" />;
      case 'keskitaso':
        return <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))] ml-2" />;
      case 'matala':
        return <ThumbsUp className="h-4 w-4 text-[hsl(var(--success))] ml-2" />;
      default:
        return null;
    }
  };

  const getPriorityLabel = (priority?: string) => {
    if (!priority) return null;
    
    const colorClass = priority.toLowerCase() === 'korkea' 
      ? 'bg-destructive/10 text-destructive' 
      : priority.toLowerCase() === 'keskitaso'
      ? 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]'
      : 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]';
    
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
          <Check className="h-5 w-5 text-[hsl(var(--success))]" />
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
                    <p className="text-muted-foreground mt-1">{recommendation.description}</p>
                    
                    {recommendation.expected_impact && (
                      <div className="mt-2 p-2 bg-[hsl(var(--chart-2))]/10 rounded border border-[hsl(var(--chart-2))]/20 text-sm text-[hsl(var(--chart-2))]/80">
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
            <p className="text-muted-foreground">Yrityksesi myyntikuntoisuus on erinomaisella tasolla! Jatka samaan malliin.</p>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-[hsl(var(--chart-1))]/10 rounded-2xl border border-[hsl(var(--chart-1))]/20">
          <p className="text-sm text-[hsl(var(--chart-1))]/80">
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
