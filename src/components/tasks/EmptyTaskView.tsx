// src/components/tasks/EmptyTaskView.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, PlusCircle, CheckCircle, ListChecks, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";

interface EmptyTaskViewProps {
  companyName?: string;
}

/**
 * Komponentti, joka näytetään kun yrityksellä ei ole vielä yhtään tehtävää
 */
const EmptyTaskView: React.FC<EmptyTaskViewProps> = ({ companyName }) => {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Tervetuloa tehtävien hallintaan</CardTitle>
          <CardDescription>
            Luo ensimmäiset tehtävät yrityksesi myyntikunnon parantamiseksi
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="p-6 text-center bg-indigo-50 rounded-lg border-2 border-dashed border-indigo-200 mb-6">
          <FileText className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Ei vielä tehtäviä</h3>
          <p className="text-slate-600 mb-6">
            Luo tehtäviä parantaaksesi yrityksesi myyntikuntoa ja arvoa.
            {companyName && ` Aloita luomalla ensimmäiset tehtävät yritykselle ${companyName}.`}
          </p>
          <Link to="/task-generator">
            <Button size="lg" className="gap-2 text-white">
              <PlusCircle className="h-5 w-5" />
              Luo tehtäviä
            </Button>
          </Link>
        </div>

        {/* Näytä vaiheet selkeästi */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center mb-2">1</div>
            <h4 className="font-medium mb-1">Luo tehtäviä</h4>
            <p className="text-sm text-slate-600">Luo tehtäviä manuaalisesti tai generoi ne tekoälyn avulla</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center mb-2">2</div>
            <h4 className="font-medium mb-1">Suorita tehtävät</h4>
            <p className="text-sm text-slate-600">Toteuta tehtävät parantaaksesi yrityksesi myyntikuntoa</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center mb-2">3</div>
            <h4 className="font-medium mb-1">Näe arvovaikutus</h4>
            <p className="text-sm text-slate-600">Analysoi tehtävien vaikutus yrityksesi arvoon</p>
          </div>
        </div>

        {/* Tietoa tehtävien hallinnasta */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold mb-3 flex items-center">
            <ListChecks className="h-5 w-5 mr-2 text-indigo-600" />
            Tietoa tehtävien hallinnasta
          </h4>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                <strong>Myyntikunnon parantaminen:</strong> Tehtävät on suunniteltu parantamaan yrityksesi myyntikuntoa 
                ja kasvattamaan sen arvoa.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <ClipboardCheck className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                <strong>Tehtävien seuranta:</strong> Seuraa edistymistäsi ja merkitse tehtävät valmiiksi 
                kun olet toteuttanut ne.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                <strong>Arvovaikutuksen analyysi:</strong> Kun olet suorittanut riittävästi tehtäviä,
                voit analysoida niiden vaikutuksen yrityksesi arvoon.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyTaskView;