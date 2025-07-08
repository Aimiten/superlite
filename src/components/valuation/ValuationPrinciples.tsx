// src/components/valuation/ValuationPrinciples.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

/**
 * Arvonmäärityksen toimintaperiaatteen kuvaava komponentti
 */
const ValuationPrinciples: React.FC = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Info className="h-5 w-5 mr-2 text-indigo-600" />
          Arvonmäärityksen toimintaperiaate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm">
            Arvonmääritys perustuu yrityksestä ladattuihin tilinpäätöstietoihin ja älykkääseen analyysiin.
            Prosessi hyödyntää useita arvostusmenetelmiä ja tarjoaa kokonaisvaltaisen analyysin yrityksen arvosta.
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-medium">1</div>
              <p>Tilinpäätöksen analysointi ja normalisoiminen markkinaehtoiseksi poistamalla kertaluonteiset erät.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-medium">2</div>
              <p>Tarkentavien kysymysten esittäminen tilinpäätöksen normalisoimiseksi (omistajan palkka, vuokrat, jne.)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-medium">3</div>
              <p>Toimiala-analyysi ja markkinakertoimien soveltaminen yrityksen lukuihin.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-medium">4</div>
              <p>Arvonmääritys usealla menetelmällä (liikevaihto-, EBITDA-, EBIT- ja P/E-kertoimet).</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-medium">5</div>
              <p>Kokonaisanalyysi vahvuuksista, heikkouksista ja kehitysmahdollisuuksista arvon kasvattamiseksi.</p>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Huom: Arvio on perustuu saatavilla oleviin tietoihin. Tarkemman arvion saat kun suoritat myyntikuntoisuuden arvionnin.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValuationPrinciples;