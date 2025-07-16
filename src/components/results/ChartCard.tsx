
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart as BarChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ChartCardProps {
  scores: {
    documentation: number;
    process: number;
    financial: number;
    customers: number;
  };
}

const ChartCard: React.FC<ChartCardProps> = ({ scores }) => {
  // Data for the chart
  const chartData = [
    { name: "Dokumentaatio", value: scores.documentation, color: "hsl(var(--chart-1))" },
    { name: "Prosessit", value: scores.process, color: "hsl(var(--success))" },
    { name: "Talous", value: scores.financial, color: "hsl(var(--chart-2))" },
    { name: "Asiakkaat", value: scores.customers, color: "hsl(var(--chart-4))" }
  ];

  return (
    <Card className="card-3d">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChartIcon className="h-5 w-5 text-[hsl(var(--chart-2))]" />
          Osa-alueiden vertailu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, "Tulos"]} />
              <Bar dataKey="value" name="Tulos">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartCard;
