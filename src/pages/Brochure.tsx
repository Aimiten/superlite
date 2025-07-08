
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Presentation, FileText, BarChart } from "lucide-react";

const Brochure = () => {
  return (
    <DashboardLayout 
      pageTitle="Myyntiesitteen luonti" 
      pageDescription="Luo ammattimainen myyntiesite yrityksestäsi kaikista analyyseistä automaattisesti."
      showBackButton={true}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Presentation className="h-5 w-5 mr-2 text-purple-600" />
              Myyntiesitteen luonti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center">
              <FileText className="h-16 w-16 mx-auto text-purple-600 mb-4" />
              <h3 className="text-xl font-medium mb-2">Ammattimainen myyntiesite</h3>
              <p className="text-slate-600 mb-6">
                Tämä työkalu luo automaattisesti ammattimaisen myyntiesitteen yrityksestäsi kaikkien tehtyjen 
                analyysien perusteella. Esite sisältää kaikki oleelliset tiedot potentiaalisia ostajia varten.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <h4 className="font-medium">PDF-muotoinen esite</h4>
                  <p className="text-sm text-slate-500">Ladattava ja jaettava dokumentti</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <BarChart className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <h4 className="font-medium">Graafit ja kaaviot</h4>
                  <p className="text-sm text-slate-500">Visualisoi yrityksesi keskeiset tiedot</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Brochure;
