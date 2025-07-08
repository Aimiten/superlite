
import React from "react";
import { useRecentActivities } from "@/hooks/use-recent-activities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, FileSpreadsheet, BarChart, FileBarChart } from "lucide-react";

const iconMap = {
  assessment: BarChart,
  valuation: FileSpreadsheet,
  task: CalendarDays,
  document: FileBarChart,
};

const ActivityTab: React.FC = () => {
  const { activities, loading, error } = useRecentActivities(20); // Haetaan enemmän aktiviteetteja kuin dashboardissa

  if (loading) {
    return <div className="text-center py-6">Ladataan aktiviteetteja...</div>;
  }

  if (error) {
    return <div className="text-center py-6 text-destructive">Virhe ladattaessa aktiviteetteja: {error}</div>;
  }

  if (!activities || activities.length === 0) {
    return <div className="text-center py-6 text-muted-foreground">Ei aktiviteetteja.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktiviteettihistoria</CardTitle>
        <CardDescription>Kaikki aiemmat toimenpiteet ja aktiviteetit</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="divide-y">
            {activities.map((activity) => {
              const Icon = iconMap[activity.type];
              return (
                <div key={activity.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-start">
                    <div className="mr-4 mt-0.5">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{activity.title}</h4>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(activity.date), "d.M.yyyy HH:mm", { locale: fi })}
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityTab;
