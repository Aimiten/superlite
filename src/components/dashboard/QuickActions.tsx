import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, LineChart, FileText, ActivitySquare, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const QuickActions = () => {
  const actionItems = [
    {
      title: "Arvonmääritys",
      description: "Kartoita yrityksesi arvo eri menetelmillä",
      icon: FileText,
      href: "/valuation",
      buttonText: "Siirry",
      color: "bg-gradient-to-br from-purple-500 to-pink-600",
    },
    {
      title: "Myyntikuntoisuus",
      description: "Arvioi yrityksesi myyntikuntoisuus ja saa kehitysehdotuksia",
      icon: LineChart,
      href: "/assessment",
      buttonText: "Siirry",
      color: "bg-gradient-to-br from-blue-500 to-indigo-600",
    },
    {
      title: "Tehtävät",
      description: "Seuraa ja toteuta suositellut tehtävät myyntikunnon kasvattamiseksi",
      icon: ActivitySquare,
      href: "/tasks",
      buttonText: "Siirry",
      color: "bg-gradient-to-br from-green-500 to-teal-600",
    },
    {
      title: "Jakaminen",
      description: "Jaa arvonmäärityksiä, myyntikuntoon-analyysejä ja raportteja turvallisesti",
      icon: Share2,
      href: "/sharing-manager",
      buttonText: "Siirry",
      color: "bg-gradient-to-br from-green-500 to-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {actionItems.map((item, index) => (
        <div key={index}>
          {/* Mobiili näkymä */}
          <Link to={item.href} className="block sm:hidden group">
            <Card className="border shadow-md hover:shadow-lg transition-shadow flex flex-col h-auto group-hover:border-primary/50">
              <CardHeader className={`text-white rounded-t-lg ${item.color} py-2`}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xs font-medium truncate">{item.title}</CardTitle>
                  <item.icon className="h-4 w-4 flex-shrink-0 ml-2" />
                </div>
              </CardHeader>
              <CardContent className="pt-1 pb-2 flex-1 flex items-center">
                <CardDescription className="text-[10px] line-clamp-2">{item.description}</CardDescription>
                <div className="flex items-center justify-end ml-auto">
                  <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Tabletti ja desktop näkymä */}
          <Card className="border shadow-md hover:shadow-lg transition-shadow flex flex-col h-[180px] hidden sm:flex">
            <CardHeader className={`text-white rounded-t-lg ${item.color} py-3`}>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium truncate">{item.title}</CardTitle>
                <item.icon className="h-5 w-5 flex-shrink-0 ml-2" />
              </div>
            </CardHeader>
            <CardContent className="pt-2 pb-1 flex-1 flex items-center">
              <CardDescription className="text-xs line-clamp-3">{item.description}</CardDescription>
            </CardContent>
            <CardFooter className="mt-auto pt-0 pb-3">
              <Link to={item.href} className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  <div className="flex items-center justify-between w-full">
                    <span>{item.buttonText}</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default QuickActions;