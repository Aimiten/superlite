// src/components/tasks/TaskImpactIndicator.tsx
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TaskImpactIndicatorProps {
  impact?: 'high' | 'medium' | 'low' | null; // Sallitaan myös null
  category: string;
}

export const TaskImpactIndicator: React.FC<TaskImpactIndicatorProps> = ({ impact, category }) => {
  // Älä näytä mitään, jos impact puuttuu tai on low
  if (!impact || impact === 'low') {
    return null;
  }

  // Määritellään karkeasti, mitkä kategoriat yleensä vaikuttavat positiivisesti vs. negatiivisesti (riskinä)
  // Tämä on yksinkertaistus, todellinen vaikutus riippuu tehtävän sisällöstä
  const positiveCategories = ['customers', 'strategy', 'financial']; // Esim. asiakkuuksien parantaminen, kasvustrategia
  const riskCategories = ['legal', 'personnel', 'operations', 'documentation']; // Esim. puutteelliset sopimukset, avainhenkilöriski

  let Icon: React.ElementType = Minus;
  let color = 'text-slate-500';
  let text = 'Vaikutus arvoon'; // Oletus tooltip

  if (positiveCategories.includes(category)) {
      Icon = TrendingUp;
      color = impact === 'high' ? 'text-green-600' : 'text-green-500';
      text = impact === 'high' ? 'Merkittävä positiivinen vaikutuspotentiaali' : 'Positiivinen vaikutuspotentiaali';
  } else if (riskCategories.includes(category)) {
      // Negatiivinen vaikutus tarkoittaa tässä riskin olemassaoloa, jonka POISTAMINEN on positiivista
      Icon = TrendingUp; // Tehtävän tekeminen (riskin poisto) on positiivista
      color = impact === 'high' ? 'text-orange-600' : 'text-orange-500'; // Oranssi kuvaamaan riskin poistoa
      text = impact === 'high' ? 'Merkittävän riskin poistaminen (vaikuttaa arvoon)' : 'Riskin poistaminen (vaikuttaa arvoon)';
      // Vaihtoehtoisesti voisi näyttää TrendingDown punaisella, jos tehtävä ITSE edustaa riskiä,
      // mutta oletetaan että tehtävät ovat korjaavia.
  } else {
       // Neutraali tai tuntematon kategoria
       Icon = Minus;
       color = 'text-slate-500';
       text = 'Vaikutus arvoon';
  }


  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
           <span tabIndex={0} className="inline-flex items-center cursor-help">
             <Icon className={`h-4 w-4 ${color} ml-1 flex-shrink-0`} />
           </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TaskImpactIndicator;