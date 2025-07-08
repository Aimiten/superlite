import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileBarChart, PlusCircle, FileText, CheckCircle, ListChecks } from "lucide-react";

interface EmptyAssessmentStateProps {
  handleStartNewAssessment: () => void;
  hasActiveCompany: boolean;
}

/**
 * Komponentti, joka näytetään kun käyttäjällä ei ole vielä yhtään myyntikuntoisuusarviointia
 */
const EmptyAssessmentState: React.FC<EmptyAssessmentStateProps> = ({ 
  handleStartNewAssessment,
  hasActiveCompany 
}) => {
  // Debug-toiminnallisuus
  console.log("EmptyAssessmentState rendered, hasActiveCompany:", hasActiveCompany);
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Tervetuloa myyntikuntoisuuden arviointiin</CardTitle>
          <CardDescription>
            Tee ensimmäinen myyntikuntoisuusarviointi yrityksellesi.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="p-6 text-center bg-indigo-50 rounded-lg border-2 border-dashed border-indigo-200 mb-6">
          <FileBarChart className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Ei vielä myyntikuntoisuusarviointeja</h3>
          <p className="text-slate-600 mb-6">
            Tee ensimmäinen myyntikuntoisuusarviointi lataamalla yrityksen dokumentit.
          </p>
          <Button 
            onClick={handleStartNewAssessment}
            size="lg"
            className="gap-2 text-white"
            disabled={!hasActiveCompany}
          >
            <PlusCircle className="h-5 w-5" />
            Aloita ensimmäinen arviointi
          </Button>
          {!hasActiveCompany && (
            <div className="mt-4 text-amber-600 text-sm">
              Valitse ensin yritys profiilissa ennen kuin voit tehdä myyntikuntoisuusarvioinnin.
            </div>
          )}
        </div>

        {/* Näytä vaiheet selkeästi */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center mb-2">1</div>
            <h4 className="font-medium mb-1">Lisää dokumentit</h4>
            <p className="text-sm text-slate-600">Lataa yrityksesi liiketoimintasuunnitelma, tilinpäätöstiedot ja muut tärkeät dokumentit</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center mb-2">2</div>
            <h4 className="font-medium mb-1">Vastaa kysymyksiin</h4>
            <p className="text-sm text-slate-600">Vastaa järjestelmän esittämiin kysymyksiin yrityksen nykytilasta</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center mb-2">3</div>
            <h4 className="font-medium mb-1">Saat kattavan analyysin</h4>
            <p className="text-sm text-slate-600">Näet yrityksesi myyntikuntoisuuden arvion, vahvuudet, heikkoudet ja kehityskohteet</p>
          </div>
        </div>

        {/* Tietoa myyntikuntoisuuden arvioinnista */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold mb-3 flex items-center">
            <ListChecks className="h-5 w-5 mr-2 text-indigo-600" />
            Tietoa myyntikuntoisuuden arvioinnista
          </h4>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                <strong>Yksi arviointikerta riittää:</strong> Myyntikuntoisuuden arviointi tehdään yleensä vain kerran. 
                Tulokset tallennetaan ja voit aina palata tarkastelemaan niitä myöhemmin.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                <strong>Monipuolinen dokumenttien analyysi:</strong> Järjestelmä analysoi dokumenteistasi tietoja, 
                joten mitä enemmän relevantteja dokumentteja lataat, sitä tarkemman arvion saat.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                <strong>Tehtävien luonti tuloksista:</strong> Analyysin jälkeen yritykselle luodaan  kehitystehtäviä, jotka parantavat yrityksesi myyntikuntoisuutta.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyAssessmentState;