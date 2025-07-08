
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, LineChart, FileText, Settings, Cog, ActivitySquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const QuickActions = () => {
  const actionItems = [
    {
      title: "Myyntikuntoisuus",
      description: "Arvioi yrityksesi myyntikuntoisuus ja saa kehitysehdotuksia",
      icon: LineChart,
      href: "/assessment",
      buttonText: "Siirry",
      color: "bg-gradient-to-br from-blue-500 to-indigo-600",
    },
    {
      title: "Arvonmääritys",
      description: "Kartoita yrityksesi arvo eri menetelmillä",
      icon: FileText,
      href: "/valuation",
      buttonText: "Siirry",
      color: "bg-gradient-to-br from-purple-500 to-pink-600",
    },
    {
      title: "Toimenpiteet",
      description: "Seuraa ja toteuta suositellut kehitystoimenpiteet",
      icon: ActivitySquare,
      href: "/tasks",
      buttonText: "Siirry",
      color: "bg-gradient-to-br from-green-500 to-teal-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actionItems.map((item, index) => (
        <Card key={index} className="border shadow-md hover:shadow-lg transition-shadow flex flex-col">
          <CardHeader className={`text-white rounded-t-lg ${item.color}`}>
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm sm:text-base md:text-lg font-medium truncate">{item.title}</CardTitle>
              <item.icon className="h-6 w-6 flex-shrink-0 ml-2" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            <CardDescription className="text-sm">{item.description}</CardDescription>
          </CardContent>
          <CardFooter className="mt-auto">
            <Link to={item.href} className="w-full">
              <Button variant="outline" className="w-full">
                <div className="flex items-center justify-between w-full">
                  <span>{item.buttonText}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default QuickActions;
