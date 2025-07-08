
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, FileSpreadsheet, BarChart, ArrowRight, FileBarChart } from "lucide-react";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import { useRecentActivities, UserActivity } from "@/hooks/use-recent-activities";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

const iconMap = {
  assessment: BarChart,
  valuation: FileSpreadsheet,
  task: CalendarDays,
  document: FileBarChart,
};

interface RecentUserActivitiesProps {
  limit?: number;
}

const RecentUserActivities: React.FC<RecentUserActivitiesProps> = ({ limit = 5 }) => {
  const { activities, loading, error } = useRecentActivities(limit);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Viimeaikaiset toimenpiteet</CardTitle>
          <CardDescription>Lataa viimeisimpiä toimenpiteitäsi...</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-start">
                  <div className="mr-4 mt-0.5">
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Viimeaikaiset toimenpiteet</CardTitle>
          <CardDescription>Tapahtui virhe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            <p>{error}</p>
            <p className="text-sm mt-2">Yritä myöhemmin uudelleen.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Viimeaikaiset toimenpiteet</CardTitle>
        <CardDescription>Viimeksi tekemäsi toimenpiteet</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px]">
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
        </ScrollArea>
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

export default RecentUserActivities;
