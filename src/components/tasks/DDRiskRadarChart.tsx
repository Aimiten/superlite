// src/components/tasks/DDRiskRadarChart.tsx
import React, { useMemo } from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from "recharts";
import { DDRiskCategory } from "../../../supabase/functions/_shared/types";

interface RiskMitigationCategory {
  kategoria: string;
  alkuperainenRiskitaso: number;
  paivitettyRiskitaso: number;
  muutosPerustelu: string;
  jaljellaolevat_toimenpiteet: string[];
}

interface DDRiskRadarChartProps {
  riskCategories: DDRiskCategory[];
  comparisonData?: RiskMitigationCategory[]; // Uusi prop: vertailudata post-DD-analyysistä
  isPostDD?: boolean; // Uusi prop: näytetäänkö vertailu
}

const DDRiskRadarChart: React.FC<DDRiskRadarChartProps> = ({ 
  riskCategories, 
  comparisonData,
  isPostDD = false
}) => {
  // Muunna data sopivaan muotoon tutkakaaviolle
  const chartData = useMemo(() => {
    if (!isPostDD || !comparisonData) {
      // Alkuperäinen toteutus kun ei näytetä vertailua
      return riskCategories.map(risk => ({
        subject: risk.kategoria,
        value: risk.riskitaso,
        fullMark: 10
      }));
    } else {
      // Yhdistetty data kun näytetään vertailu
      return riskCategories.map(risk => {
        const mitigation = comparisonData.find(item => item.kategoria === risk.kategoria);
        return {
          subject: risk.kategoria,
          original: mitigation ? mitigation.alkuperainenRiskitaso : risk.riskitaso,
          updated: mitigation ? mitigation.paivitettyRiskitaso : risk.riskitaso,
          fullMark: 10
        };
      });
    }
  }, [riskCategories, comparisonData, isPostDD]);

  // Värimäärittelyt
  const chartColors = {
    original: {
      area: "rgba(239, 68, 68, 0.5)", // Red with transparency
      stroke: "#EF4444", // Red
    },
    updated: {
      area: "rgba(59, 130, 246, 0.5)", // Blue with transparency
      stroke: "#3B82F6", // Blue
    },
    original_single: {
      area: "rgba(102, 126, 234, 0.6)", // Indigo with transparency
      stroke: "#4F46E5", // Indigo
    },
    grid: "#CBD5E1", // Slate-300
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
        <PolarGrid stroke={chartColors.grid} strokeDasharray="3 3" />
        <PolarAngleAxis 
          dataKey="subject" 
          stroke="#334155" // Slate-700
          tick={{ fontSize: 10, fill: "#334155" }} 
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 10]}
          tick={{ fontSize: 10, fill: "#334155" }}
        />

        {isPostDD && comparisonData ? (
          // Näytä kaksi datasetiä vertailussa
          <>
            <Radar
              name="Alkuperäinen riskitaso"
              dataKey="original"
              stroke={chartColors.original.stroke}
              fill={chartColors.original.area}
              fillOpacity={0.6}
            />
            <Radar
              name="Päivitetty riskitaso"
              dataKey="updated"
              stroke={chartColors.updated.stroke}
              fill={chartColors.updated.area}
              fillOpacity={0.6}
            />
            <Legend 
              wrapperStyle={{ fontSize: "12px" }}
              verticalAlign="bottom"
              height={36}
            />
          </>
        ) : (
          // Näytä vain yksi datasetti
          <Radar
            name="Riskitaso"
            dataKey="value"
            stroke={chartColors.original_single.stroke}
            fill={chartColors.original_single.area}
            fillOpacity={0.6}
          />
        )}

        <Tooltip 
          formatter={(value, name) => [`${value}/10`, name]}
          labelFormatter={(label) => `${label}`}
          contentStyle={{ 
            backgroundColor: "white", 
            borderColor: "#E2E8F0", // Slate-200
            borderRadius: "0.375rem",
            fontSize: "0.875rem"
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default DDRiskRadarChart;