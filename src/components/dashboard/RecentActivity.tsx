
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, FileSpreadsheet, BarChart, ArrowRight, FileBarChart } from "lucide-react";
import { format } from "date-fns";
import { fi } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: "assessment" | "valuation" | "task" | "document";
  title: string;
  date: string;
  description?: string;
  link: string;
}

const iconMap = {
  assessment: BarChart,
  valuation: FileSpreadsheet,
  task: CalendarDays,
  document: FileBarChart,
};

interface RecentActivityProps {
  activities: ActivityItem[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle>Viimeaikaiset toimenpiteet</CardTitle>
          <CardDescription>Näet täällä viimeaikaiset toimenpiteesi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Ei viimeaikaisia toimenpiteitä.</p>
            <p className="text-sm mt-2">Aloita käyttämällä työkaluja yrityksesi kehittämiseen.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle>Viimeaikaiset toimenpiteet</CardTitle>
        <CardDescription>Viimeksi tekemäsi toimenpiteet</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
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
                  <div className="ml-2">
                    <Link to={activity.link}>
                      <Button size="sm" variant="ghost">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 p-2">
        <Link to="/profile" className="w-full">
          <Button variant="ghost" size="sm" className="w-full justify-between">
            Näytä kaikki <ArrowRight className="ml-2 h-3 w-3" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default RecentActivity;
