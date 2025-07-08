import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, AlertTriangle, CheckCircle2, FileText, Users, Building, Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AssessmentHelpSection = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Myyntikuntotesti</CardTitle>
        <CardDescription>
          Arvioi yrityksesi valmiutta myyntiprosessiin ja saa kohdennettuja parannusehdotuksia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Target className="h-4 w-4" />
          <AlertDescription>
            <strong>Tavoite:</strong> Tunnista yrityksen vahvuudet ja kehityskohteet ennen myyntiprosessin aloittamista.
          </AlertDescription>
        </Alert>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="overview">
            <AccordionTrigger>📋 Yleiskatsaus myyntikuntotestiin</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Myyntikuntotesti arvioi yrityksen valmiutta myyntiprosessiin seitsemän kriittisen osa-alueen kautta. 
                  Testi tuottaa yksityiskohtaisen analyysin ja automaattisia toimenpidesuosituksia.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">Mitä saat</h4>
                    <ul className="text-sm list-disc pl-4 space-y-1">
                      <li>Kokonaisarvosana (0-100)</li>
                      <li>Osa-aluekohtaiset pisteet</li>
                      <li>Yksityiskohtainen analyysi</li>
                      <li>Automaattiset tehtävät</li>
                      <li>Kehityssuunnitelma</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">Kesto ja vaatimukset</h4>
                    <ul className="text-sm list-disc pl-4 space-y-1">
                      <li>15-30 minuuttia</li>
                      <li>Yrityksen perustiedot</li>
                      <li>Taloudellisia tunnuslukuja</li>
                      <li>Liiketoiminnan tuntemusta</li>
                      <li>Dokumenttien saatavuutta</li>
                    </ul>
                  </div>
                </div>

                <Button onClick={() => navigate("/assessment")} className="w-full">
                  Aloita myyntikuntotesti →
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="categories">
            <AccordionTrigger>🎯 Arvioitavat osa-alueet</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold">Talous (Financial)</h4>
                      <Badge variant="outline">25 pistettä</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Yrityksen taloudellinen tilanne ja raportointi
                    </p>
                    <ul className="text-sm list-disc pl-6 space-y-1">
                      <li>Tilinpäätösten laatu ja ajantasaisuus</li>
                      <li>Taloudellinen suorituskyky</li>
                      <li>Kassavirta ja maksukyky</li>
                      <li>Budjetointi ja ennusteet</li>
                      <li>Taloudellinen raportointi</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Scale className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold">Juridiikka (Legal)</h4>
                      <Badge variant="outline">15 pistettä</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Oikeudelliset velvoitteet ja compliance
                    </p>
                    <ul className="text-sm list-disc pl-6 space-y-1">
                      <li>Yhtiöoikeudelliset asiat</li>
                      <li>Sopimukset ja lisenssit</li>
                      <li>Immateriaaliomaisuus</li>
                      <li>Kiinteistöt ja vuokrasopimukset</li>
                      <li>Oikeudenkäynnit ja riidat</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold">Operaatiot (Operations)</h4>
                      <Badge variant="outline">15 pistettä</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Liiketoiminnan tehokkuus ja prosessit
                    </p>
                    <ul className="text-sm list-disc pl-6 space-y-1">
                      <li>Tuotanto ja palveluprosessit</li>
                      <li>Laatujärjestelmät</li>
                      <li>Toimittajasuhteet</li>
                      <li>Teknologia ja järjestelmät</li>
                      <li>Operatiivinen tehokkuus</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <h4 className="font-semibold">Dokumentaatio (Documentation)</h4>
                      <Badge variant="outline">10 pistettä</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Prosessien ja tietojen dokumentointi
                    </p>
                    <ul className="text-sm list-disc pl-6 space-y-1">
                      <li>Prosessikuvaukset</li>
                      <li>Käyttöohjeet ja manuaalit</li>
                      <li>Organisaatiokaaviot</li>
                      <li>Tiedon hallinta</li>
                      <li>Raportointi ja seuranta</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-red-600" />
                      <h4 className="font-semibold">Asiakkaat (Customers)</h4>
                      <Badge variant="outline">15 pistettä</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Asiakassuhteet ja markkinointi
                    </p>
                    <ul className="text-sm list-disc pl-6 space-y-1">
                      <li>Asiakaskunnan laatu ja sitoutuneisuus</li>
                      <li>Asiakaskeskittymä ja riippuvuus</li>
                      <li>Myynti- ja markkinointiprosessit</li>
                      <li>Brändi ja markkinointi</li>
                      <li>Asiakastyytyväisyys</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-semibold">Henkilöstö (Personnel)</h4>
                      <Badge variant="outline">10 pistettä</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Henkilöstöhallinto ja osaaminen
                    </p>
                    <ul className="text-sm list-disc pl-6 space-y-1">
                      <li>Avainhenkilöriippuvuus</li>
                      <li>Henkilöstön sitoutuneisuus</li>
                      <li>Osaamisen hallinta</li>
                      <li>Palkitsemis- ja kannustinjärjestelmät</li>
                      <li>Työsopimukset ja HR-prosessit</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-teal-600" />
                      <h4 className="font-semibold">Strategia (Strategy)</h4>
                      <Badge variant="outline">10 pistettä</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Strateginen suunnittelu ja visio
                    </p>
                    <ul className="text-sm list-disc pl-6 space-y-1">
                      <li>Liiketoimintastrategia</li>
                      <li>Kilpailuasema</li>
                      <li>Kasvusuunnitelmat</li>
                      <li>Innovaatio ja kehitys</li>
                      <li>Exit-strategia</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="process">
            <AccordionTrigger>🔄 Testin suorittaminen</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Vaihe 1: Valmistelu</h4>
                  <ul className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Varmista että yrityksen perustiedot ovat ajan tasalla</li>
                    <li>Hanki esille viimeisimmät tilinpäätökset</li>
                    <li>Valmistele tiedot asiakkaista ja henkilöstöstä</li>
                    <li>Mieti yrityksen strategiset tavoitteet</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Vaihe 2: Kysymyksiin vastaaminen</h4>
                  <ul className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Vastaa kysymyksiin rehellisesti ja tarkasti</li>
                    <li>Käytä "En tiedä" -vaihtoehtoa tarvittaessa</li>
                    <li>Lisää kommentteja täsmentämään vastauksiasi</li>
                    <li>Voit tallentaa testin ja jatkaa myöhemmin</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Vaihe 3: Tulosten analysointi</h4>
                  <ul className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Tarkastele kokonaisarvosana ja osa-aluepisteet</li>
                    <li>Lue yksityiskohtainen analyysi</li>
                    <li>Priorisoi kehityskohteet</li>
                    <li>Hyödynnä automaattisesti luotuja tehtäviä</li>
                  </ul>
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Vinkki:</strong> Voit suorittaa testin useita kertoja ja seurata kehitystä ajan myötä.
                  </AlertDescription>
                </Alert>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="scoring">
            <AccordionTrigger>📊 Pisteytys ja tulkinta</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Pistetaulukko</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="font-medium">0-40 pistettä: Heikko</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Merkittäviä puutteita useilla osa-alueilla. Vaatii perusteellista kehittämistä ennen myyntiä.
                      </p>
                    </div>
                    <div className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="font-medium">41-60 pistettä: Tyydyttävä</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Perusasiat kunnossa, mutta selkeitä kehityskohteita. Myynti mahdollista parannusten jälkeen.
                      </p>
                    </div>
                    <div className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="font-medium">61-80 pistettä: Hyvä</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Yritys on hyvin valmisteltu myyntiprosessiin. Pienet parannukset voivat nostaa arvoa.
                      </p>
                    </div>
                    <div className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium">81-100 pistettä: Erinomainen</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Yritys on erinomaisesti valmisteltu. Voi aloittaa myyntiprosessin luottavaisin mielin.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Osa-alueiden painotus</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Eri osa-alueet vaikuttavat kokonaispistemäärään seuraavasti:
                  </p>
                  <ul className="text-sm list-disc pl-6 space-y-1">
                    <li><strong>Talous (25%):</strong> Tärkein osa-alue, vaikuttaa merkittävästi</li>
                    <li><strong>Asiakkaat ja Operaatiot (15% kumpikin):</strong> Liiketoiminnan ydin</li>
                    <li><strong>Juridiikka (15%):</strong> Riskien minimointi</li>
                    <li><strong>Henkilöstö, Dokumentaatio, Strategia (10% kumpikin):</strong> Tukevat osa-alueet</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="results">
            <AccordionTrigger>📈 Tulosten hyödyntäminen</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Automaattiset tehtävät</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Testin perusteella luodaan automaattisesti kohdennettuja tehtäviä:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Priorisoidaan heikoimmat osa-alueet</li>
                    <li>Jaetaan kategorioittain</li>
                    <li>Sisältävät yksityiskohtaiset ohjeet</li>
                    <li>Arviointi vaikutuksesta yrityksen arvoon</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Kehityssuunnitelma</h4>
                  <ol className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Aloita kriittisimmistä puutteista (alle 50% osa-alueet)</li>
                    <li>Keskity tehtäviin joilla suurin vaikutus</li>
                    <li>Aseta realistiset aikataulut</li>
                    <li>Seuraa edistymistä säännöllisesti</li>
                    <li>Tee uusi testi 3-6 kuukauden kuluttua</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Due Diligence -valmistautuminen</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Testi auttaa tunnistamaan DD-prosessin kriittiset kohdat:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Dokumenttien täydentäminen</li>
                    <li>Prosessien selkeyttäminen</li>
                    <li>Riskien minimointi</li>
                    <li>Avainhenkilöriippuvuuden vähentäminen</li>
                  </ul>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Muista:</strong> Myyntikuntotesti on prosessi, ei kertaluonteinen tapahtuma. Säännöllinen arviointi ja parannus nostaa yrityksen arvoa.
                  </AlertDescription>
                </Alert>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tips">
            <AccordionTrigger>💡 Parhaat käytännöt</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Ennen testiä</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Varaa riittävästi aikaa (30-45 minuuttia)</li>
                    <li>Hanki esille tarvittavat dokumentit</li>
                    <li>Keskustele avainhenkilöiden kanssa</li>
                    <li>Valmistele realistinen kuva yrityksen tilasta</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Testin aikana</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Ole rehellinen - vain totuudenmukainen arvio auttaa</li>
                    <li>Käytä kommenttikenttää täsmentämään vastauksia</li>
                    <li>Älä yritä "pumpata" pisteitä - se ei auta</li>
                    <li>Tallenna välillä jos testi kestää kauan</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tulosten jälkeen</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Keskity 2-3 tärkeimpään kehityskohteeseen</li>
                    <li>Aseta konkreettisia tavoitteita ja aikatauluja</li>
                    <li>Delegoi tehtäviä sopivilla henkilöille</li>
                    <li>Seuraa edistymistä tehtävänhallinnan kautta</li>
                    <li>Hyödynnä AI-assistenttia kysymyksissä</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default AssessmentHelpSection;