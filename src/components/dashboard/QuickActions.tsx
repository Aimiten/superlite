import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Share2, Bot, FileStack } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const QuickActions = () => {
  const actionItems = [
    {
      title: "Arvonmääritys",
      description: "Kartoita yrityksesi arvo eri menetelmillä",
      icon: FileText,
      href: "/valuation",
      buttonText: "Siirry",
      color: "bg-secondary",
    },
    {
      title: "Jakaminen",
      description: "Jaa arvonmäärityksiä ja raportteja turvallisesti",
      icon: Share2,
      href: "/sharing-manager",
      buttonText: "Siirry",
      color: "bg-primary",
    },
    {
      title: "Kysy AI:lta",
      description: "Keskustele tekoälyn kanssa ja saa neuvoja yritystoimintaan",
      icon: Bot,
      href: "/ai-assistant",
      buttonText: "Siirry",
      color: "bg-primary",
    },
    {
      title: "Dokumentit",
      description: "Hallitse yrityksen dokumentteja ja tiedostoja",
      icon: FileStack,
      href: "/profile?tab=documents",
      buttonText: "Siirry",
      color: "bg-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-3">
      {actionItems.map((item, index) => (
        <div key={index}>
          {/* Mobiili näkymä */}
          <Link to={item.href} className="block sm:hidden group">
            <Card className="border shadow-neumorphic hover:shadow-neumorphic-pressed transition-all flex flex-col h-auto group-hover:border-primary/50">
              <CardHeader className={`text-white rounded-t-lg ${item.color} p-4`}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-medium truncate">{item.title}</CardTitle>
                  <item.icon className="h-6 w-6 flex-shrink-0 ml-2" />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex items-center min-h-[60px]">
                <CardDescription className="text-sm line-clamp-2 flex-1">{item.description}</CardDescription>
                <div className="flex items-center justify-end ml-3">
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Tabletti ja desktop näkymä */}
          <Card className="border shadow-neumorphic hover:shadow-neumorphic-pressed transition-all flex flex-col h-[180px] hidden sm:flex">
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