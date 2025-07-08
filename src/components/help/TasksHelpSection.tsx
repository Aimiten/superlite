import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Target, TrendingUp, AlertTriangle, Clock, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TasksHelpSection = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tehtävät</CardTitle>
        <CardDescription>
          Systemaattinen tapa parantaa yrityksen myyntikuntoa ja nostaa arvoa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <strong>Hyöty:</strong> Suoritetut tehtävät voivat nostaa yrityksen arvoa 10-30% ja parantaa myyntiä merkittävästi.
          </AlertDescription>
        </Alert>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="overview">
            <AccordionTrigger>🎯 Tehtävienhallinnan yleiskuva</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tehtävienhallinta on järjestelmällinen tapa tunnistaa ja toteuttaa yrityksen myyntikuntoa parantavat toimenpiteet.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">Tehtävien lähteet</h4>
                    <ul className="text-sm list-disc pl-4 space-y-1">
                      <li>Myyntikuntotestin tulokset</li>
                      <li>Arvonmäärityksen suositukset</li>
                      <li>AI-assistentin ehdotukset</li>
                      <li>Manuaalisesti luodut tehtävät</li>
                      <li>Due diligence -valmistelu</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">Tehtävätyypit</h4>
                    <ul className="text-sm list-disc pl-4 space-y-1">
                      <li>Tekstivastaukset</li>
                      <li>Dokumenttien lataus</li>
                      <li>Monivalinta</li>
                      <li>Tarkistuslistat</li>
                      <li>Yhteystietojen keruu</li>
                    </ul>
                  </div>
                </div>

                <Button onClick={() => navigate("/tasks")} className="w-full">
                  Siirry tehtäviin →
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="categories">
            <AccordionTrigger>📂 Tehtäväkategoriat</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold">Talous (Financial)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Taloudellisten prosessien ja raportoinnin parantaminen</p>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold">Juridiikka (Legal)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Oikeudellisten riskien minimointi ja compliance</p>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <h4 className="font-semibold">Operaatiot (Operations)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Liiketoimintaprosessien tehostaminen</p>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-red-600" />
                    <h4 className="font-semibold">Asiakkaat (Customers)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Asiakassuhteiden vahvistaminen ja monipuolistaminen</p>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-semibold">Henkilöstö (Personnel)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">HR-prosessien kehittäminen ja riippuvuuksien vähentäminen</p>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <h4 className="font-semibold">Dokumentaatio (Documentation)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Prosessien ja tietojen systematisointi</p>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-teal-600" />
                    <h4 className="font-semibold">Strategia (Strategy)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Strategisen suunnittelun ja vision kirkastaminen</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="workflow">
            <AccordionTrigger>🔄 Tehtävien suorittaminen</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">1. Tehtävän valinta</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Priorisoi korkean vaikutuksen tehtävät</li>
                    <li>Aloita helpoimmista jos motivaatiota tarvitaan</li>
                    <li>Huomioi riippuvuudet muista tehtävistä</li>
                    <li>Tarkista vaadittavat resurssit</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">2. Tehtävän suorittaminen</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Lue tehtävän kuvaus huolellisesti</li>
                    <li>Katso esimerkit ja ohjeet</li>
                    <li>Kerää tarvittavat tiedot ja dokumentit</li>
                    <li>Täytä vastaukset perusteellisesti</li>
                    <li>Lataa pyydetyt dokumentit</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">3. Laadunvarmistus</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Tarkista vastausten täydellisyys</li>
                    <li>Varmista dokumenttien laatu</li>
                    <li>Pyydä kollegalta tarkistus tarvittaessa</li>
                    <li>Merkitse tehtävä valmiiksi</li>
                  </ul>
                </div>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Ajoitus:</strong> Keskimääräinen tehtävä vie 15-60 minuuttia. Vaativammat tehtävät voivat kestää useita tunteja.
                  </AlertDescription>
                </Alert>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="types">
            <AccordionTrigger>📝 Tehtävätyypit</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold mb-2">Tekstivastaukset</h4>
                  <p className="text-sm text-muted-foreground mb-2">Vapaamuotoisia kuvauksia ja selityksiä</p>
                  <ul className="text-sm list-disc pl-4 space-y-1">
                    <li>Prosessikuvaukset</li>
                    <li>Strategiset suunnitelmat</li>
                    <li>Analyysit ja arvioinnit</li>
                    <li>Toimenpidesuunnitelmat</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold mb-2">Dokumenttien lataus</h4>
                  <p className="text-sm text-muted-foreground mb-2">Tiedostojen jakaminen ja arkistointi</p>
                  <ul className="text-sm list-disc pl-4 space-y-1">
                    <li>Sopimukset ja lisenssit</li>
                    <li>Organisaatiokaaviot</li>
                    <li>Prosessikuvaukset</li>
                    <li>Raportit ja analyysit</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold mb-2">Monivalinta</h4>
                  <p className="text-sm text-muted-foreground mb-2">Strukturoidut valinnat ja luokittelut</p>
                  <ul className="text-sm list-disc pl-4 space-y-1">
                    <li>Kyllä/Ei -kysymykset</li>
                    <li>Luokittelut ja kategoriat</li>
                    <li>Prioriteettijärjestykset</li>
                    <li>Arviointiasteikot</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold mb-2">Tarkistuslistat</h4>
                  <p className="text-sm text-muted-foreground mb-2">Vaiheittaiset tehtävälistat</p>
                  <ul className="text-sm list-disc pl-4 space-y-1">
                    <li>Compliance-tarkistukset</li>
                    <li>Laadunvarmistus</li>
                    <li>Prosessin vaiheet</li>
                    <li>Dokumenttien tarkistus</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="impact">
            <AccordionTrigger>💰 Arvovaikutusanalyysi</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tehtävien suorittaminen vaikuttaa suoraan yrityksen arvoon ja myyntikuntoon.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">Korkean vaikutuksen tehtävät</h4>
                    <ul className="text-sm list-disc pl-4 space-y-1">
                      <li>Taloudellisen raportoinnin parantaminen</li>
                      <li>Asiakaskeskittymän vähentäminen</li>
                      <li>Avainhenkilöriippuvuuden minimointi</li>
                      <li>Prosessien dokumentointi</li>
                      <li>Juridisten riskien poistaminen</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">Vaikutuksen mittaaminen</h4>
                    <ul className="text-sm list-disc pl-4 space-y-1">
                      <li>Automaattinen arvovaikutusarvio</li>
                      <li>Myyntikuntopistemäärän parannus</li>
                      <li>Due diligence -riskin väheneminen</li>
                      <li>Neuvotteluaseman vahvistuminen</li>
                      <li>Myyntiajan lyheneminen</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Pro (99€/kk):</strong> Näe reaaliaikaisesti miten tehtävien suorittaminen nostaa yrityksen arvoa.
                  </AlertDescription>
                </Alert>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="dd-tasks">
            <AccordionTrigger>🔍 Due Diligence -tehtävät</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Erityiset tehtävät due diligence -prosessiin valmistautumiseen ja riskien minimointiin.
                </p>

                <div>
                  <h4 className="font-semibold mb-2">DD-riskien kategoriat</h4>
                  <div className="grid gap-3">
                    <div className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="font-medium text-sm">Korkea riski</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Vaatii välitöntä huomiota ennen myyntiprosessia</p>
                    </div>
                    <div className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-sm">Keskitason riski</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Hoidettava DD-prosessin aikana</p>
                    </div>
                    <div className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium text-sm">Matala riski</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Valmistelutehtäviä ja dokumentaatiota</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tyypillisiä DD-tehtäviä</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Sopimusten kattavuuden tarkistus</li>
                    <li>Henkilöstörekisterin ajantasaistaminen</li>
                    <li>IP-oikeuksien dokumentointi</li>
                    <li>Asiakassopimusten analyysi</li>
                    <li>Toimittajasuhteiden kartoitus</li>
                    <li>Taloudellisten tunnuslukujen täsmäytys</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tips">
            <AccordionTrigger>💡 Tehokkuusvinkkejä</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Priorisointi</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Aloita korkean vaikutuksen tehtävistä</li>
                    <li>Hoida kriittiset riskit ensin</li>
                    <li>Tee helpot tehtävät motivaation ylläpitämiseksi</li>
                    <li>Huomioi riippuvuudet tehtävien välillä</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tehokkuus</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Tee samankaltaiset tehtävät kerralla</li>
                    <li>Valmistele dokumentit etukäteen</li>
                    <li>Delegoi sopivat tehtävät muille</li>
                    <li>Käytä AI-assistenttia apuna</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Laadunvarmistus</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Tarkista vastaukset ennen tallentamista</li>
                    <li>Pyydä kollegalta kommentteja</li>
                    <li>Dokumentoi perustelut päätöksille</li>
                    <li>Päivitä tietoja säännöllisesti</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Seuranta</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Tarkista edistyminen viikoittain</li>
                    <li>Juhli välitavoitteiden saavuttamista</li>
                    <li>Analysoi arvovaikutusta säännöllisesti</li>
                    <li>Tee uusi myyntikuntotesti kuukausittain</li>
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

export default TasksHelpSection;