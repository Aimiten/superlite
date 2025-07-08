
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface OverviewCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  iconColor: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  description,
  icon,
  iconColor,
  trend,
  trendValue,
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="card-3d h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">{title}</CardTitle>
          <div className={`p-2 rounded-full ${iconColor}`}>{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          
          {trend && trendValue && (
            <div className="flex items-center mt-2">
              <span className={`text-xs ${
                trend === "up" 
                  ? "text-green-600" 
                  : trend === "down" 
                  ? "text-red-600" 
                  : "text-slate-600"
              }`}>
                {trendValue}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OverviewCard;
