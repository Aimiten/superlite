import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

interface ValuationRangeChartProps {
  min: number;
  max: number;
  mostLikely: number;
  bookValue?: number;
}

/**
 * Komponentti yrityksen arvon vaihteluvälin visualisointiin
 */
const ValuationRangeChart: React.FC<ValuationRangeChartProps> = ({
  min,
  max,
  mostLikely,
  bookValue
}) => {
  // Varmista, että arvot ovat numeroita, tai käytä oletusarvoja
  const safeMin = isNaN(min) || min === null ? 0 : min;
  const safeMax = isNaN(max) || max === null ? 100000 : max;
  const safeMostLikely = isNaN(mostLikely) || mostLikely === null ? (safeMin + safeMax) / 2 : mostLikely;
  const safeBookValue = isNaN(bookValue) || bookValue === null ? null : bookValue;

  // Lisää pieni suoja-alue minimi- ja maksimiarvojen ympärille
  const padding = (safeMax - safeMin) * 0.1;
  const chartMin = Math.max(0, safeMin - padding); // Ei negatiivisia arvoja
  const chartMax = safeMax + padding;

  // Luo datapisteistä jatkuva käyrä
  const gaussianCurveData = [];

  // Luodaan Gaussin käyrää muistuttava jakauma, jossa huippu on todennäköisin arvo
  const calculateGaussian = (x: number, mean: number, variance: number) => {
    return Math.exp(-0.5 * Math.pow((x - mean) / variance, 2));
  };

  // Luodaan pisteet käyrää varten
  const points = 50;
  const variance = (safeMax - safeMin) / 4; // Säädä hajontaa tarpeen mukaan

  for (let i = 0; i < points; i++) {
    const x = chartMin + (chartMax - chartMin) * (i / (points - 1));
    const y = calculateGaussian(x, safeMostLikely, variance);

    gaussianCurveData.push({
      value: x,
      probability: y,
      // Flag points that represent our key values
      isMin: Math.abs(x - safeMin) < (chartMax - chartMin) / points,
      isMax: Math.abs(x - safeMax) < (chartMax - chartMin) / points,
      isMostLikely: Math.abs(x - safeMostLikely) < (chartMax - chartMin) / points,
      isBookValue: safeBookValue !== null && Math.abs(x - safeBookValue) < (chartMax - chartMin) / points,
    });
  }

  // Muotoile valuutta suomalaiseen muotoon ilman desimaaleja
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(value);
  };

  // Mukautettu tooltip, joka näyttää arvon euroina
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      let label = formatCurrency(data.value);
      let description = "";

      // Lisää selite, jos kyseessä on erikoispiste
      if (data.isMostLikely) {
        description = "Todennäköisin arvo";
      } else if (data.isMin) {
        description = "Minimiarvo";
      } else if (data.isMax) {
        description = "Maksimiarvo";
      } else if (data.isBookValue) {
        description = "Taseen arvo";
      }

      return (
        <div className="bg-card p-2 border rounded shadow-neumorphic">
          <p className="font-medium">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-36">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={gaussianCurveData}
          margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="value" 
            type="number" 
            domain={[chartMin, chartMax]} 
            tickFormatter={formatCurrency}
            allowDataOverflow={true}
            tick={{ fontSize: 11 }}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />

          {/* Käyrä */}
          <Line
            type="monotone"
            dataKey="probability"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 8 }}
            isAnimationActive={true}
          />

          {/* Viitejana todennäköisimmälle arvolle */}
          <ReferenceLine
            x={safeMostLikely}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeDasharray="3 3"
            label={{
              value: formatCurrency(safeMostLikely),
              position: 'top',
              fill: 'hsl(var(--primary))',
              fontSize: 12,
            }}
          />

          {/* Viitejana minimiarvon kohdalle */}
          <ReferenceLine
            x={safeMin}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            label={{
              value: formatCurrency(safeMin),
              position: 'insideBottomLeft',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 11,
            }}
          />

          {/* Viitejana maksimiarvon kohdalle */}
          <ReferenceLine
            x={safeMax}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            label={{
              value: formatCurrency(safeMax),
              position: 'insideBottomRight',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 11,
            }}
          />

          {/* Viitejana tasearvon kohdalle, jos saatavilla */}
          {safeBookValue !== null && (
            <ReferenceLine
              x={safeBookValue}
              stroke="hsl(var(--success))"
              strokeDasharray="5 5"
              label={{
                value: "Tasearvo",
                position: 'top',
                fill: 'hsl(var(--success))',
                fontSize: 10,
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ValuationRangeChart;