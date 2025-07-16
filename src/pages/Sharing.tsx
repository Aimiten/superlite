
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, FileText, BarChart2, ClipboardCheck, ExternalLink, ListChecks } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const Sharing = () => {
  return (
    <DashboardLayout 
      pageTitle="Yhteistyötyökalut" 
      pageDescription="Jaa analyysit, arvioinnit ja raportit yhteistyökumppaneille turvallisesti."
      showBackButton={true}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Share2 className="h-5 w-5 mr-2 text-primary" />
              Jakamistyökalut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center">
              <Share2 className="h-16 w-16 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-medium mb-2">Jaa analyysejä ja raportteja turvallisesti</h3>
              <p className="text-muted-foreground mb-6">
                Tämän ominaisuuden avulla voit jakaa arvonmäärityksiä, myyntikuntoon-analyysejä ja muita 
                raportteja suoraan asiantuntijoille tai sidosryhmille turvallisesti.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <div className="bg-muted p-4 rounded-lg">
                  <BarChart2 className="h-8 w-8 mx-auto text-primary mb-2" />
                  <h4 className="font-medium">Arvonmääritykset</h4>
                  <p className="text-sm text-muted-foreground">Jaa yrityksen arvonmäärityksiä</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <ClipboardCheck className="h-8 w-8 mx-auto text-primary mb-2" />
                  <h4 className="font-medium">Myyntikunto-analyysit</h4>
                  <p className="text-sm text-muted-foreground">Jaa myyntikuntoon-analyysejä</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <ListChecks className="h-8 w-8 mx-auto text-primary mb-2" />
                  <h4 className="font-medium">Tehtävät</h4>
                  <p className="text-sm text-muted-foreground">Jaa tehtävälistoja sidosryhmille</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
                  <h4 className="font-medium">Raportit</h4>
                  <p className="text-sm text-muted-foreground">Jaa muita yritysraportteja</p>
                </div>
              </div>
              
              <Link to="/sharing-manager">
                <Button size="lg" className="gap-2">
                  <Share2 className="h-5 w-5" />
                  Hallitse jakamista
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Sharing;
