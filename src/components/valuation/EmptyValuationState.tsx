import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileBarChart, PlusCircle } from "lucide-react";
import ValuationPrinciples from "./ValuationPrinciples";

interface EmptyValuationStateProps {
  startNewValuation: () => void;
  hasActiveCompany: boolean;
}

/**
 * Komponentti, joka näytetään kun käyttäjällä ei ole vielä yhtään arvonmääritystä
 */
const EmptyValuationState: React.FC<EmptyValuationStateProps> = ({ 
  startNewValuation,
  hasActiveCompany
}) => {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Tervetuloa arvonmääritykseen</CardTitle>
          <CardDescription>
            Luo ensimmäinen arvonmäärityksesi yrityksellesi
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="p-6 text-center bg-indigo-50 rounded-lg border-2 border-dashed border-indigo-200 mb-6">
          <FileBarChart className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Ei vielä arvonmäärityksiä</h3>
          <p className="text-slate-600 mb-6">
            Luo ensimmäinen arvonmäärityksesi lataamalla yrityksesi tilinpäätöstiedot.
          </p>
          <Button 
            onClick={startNewValuation}
            size="lg"
            className="gap-2 text-white"
            disabled={!hasActiveCompany}
          >
            <PlusCircle className="h-5 w-5" />
            Luo ensimmäinen arvonmääritys
          </Button>
          {!hasActiveCompany && (
            <div className="mt-4 text-amber-600 text-sm">
              Valitse ensin yritys profiilissa ennen kuin voit luoda arvonmäärityksen.
            </div>
          )}
        </div>

        {/* Näytä vaiheet selkeästi */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center mb-2">1</div>
            <h4 className="font-medium mb-1">Valitse tiedostot</h4>
            <p className="text-sm text-slate-600">Lisää yrityksesi tilinpäätöstiedot ja tase-erittelyt</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center mb-2">2</div>
            <h4 className="font-medium mb-1">Arvento analysoi</h4>
            <p className="text-sm text-slate-600">Järjestelmä analysoi tilinpäätöksen ja esittää kysymyksiä</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center mb-2">3</div>
            <h4 className="font-medium mb-1">Saat arvonmäärityksen</h4>
            <p className="text-sm text-slate-600">Näet yrityksesi arvon ja voit jatkaa myyntikunnon arviontiin</p>
          </div>
        </div>

        {/* Näytä arvonmäärityksen toimintaperiaate */}
        <ValuationPrinciples />
      </CardContent>
    </Card>
  );
};

export default EmptyValuationState;