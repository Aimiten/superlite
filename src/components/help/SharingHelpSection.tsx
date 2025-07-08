import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, Shield, Eye, Calendar, MessageSquare, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SharingHelpSection = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Turvallinen jakaminen</CardTitle>
        <CardDescription>
          Jaa yrityksen tietoja turvallisesti ulkopuolisten tahojen kanssa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Turvallisuus:</strong> Kaikki jaetut tiedot ovat salasanasuojattuja ja voit hallita käyttöoikeuksia.
          </AlertDescription>
        </Alert>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="overview">
            <AccordionTrigger>📤 Jakamisen yleiskuva</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Jakamisominaisuus mahdollistaa yrityksen tietojen turvallisen jakamisen potentiaalisten ostajien, neuvonantajien tai muiden sidosryhmien kanssa.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">Mitä voit jakaa</h4>
                    <ul className="text-sm list-disc pl-4 space-y-1">
                      <li>Arvonmääritysraportteja</li>
                      <li>Myyntikuntotestin tuloksia</li>
                      <li>Yksittäisiä dokumentteja</li>
                      <li>Tehtäviä ja niiden tiloja</li>
                      <li>Arvovaikutusanalyyseja</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">Kenelle voit jakaa</h4>
                    <ul className="text-sm list-disc pl-4 space-y-1">
                      <li>M&A-neuvonantajille</li>
                      <li>Potentiaalisille ostajille</li>
                      <li>Rahoittajille</li>
                      <li>Lakimiehille ja tilintarkastajille</li>
                      <li>Muille konsulteille</li>
                    </ul>
                  </div>
                </div>

                <Button onClick={() => navigate("/sharing")} className="w-full">
                  Siirry jakamiseen →
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="permissions">
            <AccordionTrigger>🔐 Käyttöoikeudet ja turvallisuus</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Käyttöoikeustasot</h4>
                  <div className="space-y-3">
                    <div className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Katseluoikeus</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Vastaanottaja voi vain katsella jaettuja tietoja</p>
                    </div>
                    <div className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-green-500" />
                        <span className="font-medium">Kommentointioikeus</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Vastaanottaja voi jättää kommentteja ja kysymyksiä</p>
                    </div>
                    <div className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">Muokkausoikeus</span>
                        <Badge variant="secondary">Pro (99€/kk)</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Vastaanottaja voi muokata tiettyjä kenttiä</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Turvallisuusominaisuudet</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Automaattinen sähköposti-ilmoitus vastaanottajalle</li>
                    <li>Automaattinen vanhentuminen</li>
                    <li>Käyttöloki ja seuranta</li>
                    <li>Peruutusoikeus milloin tahansa</li>
                    <li>Kommenttien hallinta ja seuranta</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="process">
            <AccordionTrigger>🔄 Jakamisprosessi</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Vaihe 1: Sisällön valinta</h4>
                  <ol className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Siirry Jakaminen-sivulle</li>
                    <li>Klikkaa "Luo uusi jako"</li>
                    <li>Valitse jaettavat kohteet</li>
                    <li>Määritä näkyvyysasetukset</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Vaihe 2: Käyttöoikeuksien määrittely</h4>
                  <ol className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Valitse käyttöoikeustaso</li>
                    <li>Aseta vanhentumisaika</li>
                    <li>Määritä salasana (valinnainen)</li>
                    <li>Lisää IP-rajoitukset tarvittaessa</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Vaihe 3: Jakaminen</h4>
                  <ol className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Anna vastaanottajan sähköpostiosoite (valinnainen)</li>
                    <li>Kirjoita viesti vastaanottajalle</li>
                    <li>Luo jako - linkki kopioidaan automaattisesti</li>
                    <li>Jos annoit sähköpostin, vastaanottaja saa automaattisen ilmoituksen</li>
                    <li>Seuraa käyttöä reaaliaikaisesti</li>
                  </ol>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="expiration">
            <AccordionTrigger>⏰ Vanhentumisasetukset</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Automaattinen vanhentuminen</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Voit asettaa jaettujen sisältöjen automaattisen vanhentumisen:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>7 päivää (pikakatselu)</li>
                    <li>30 päivää (Due Diligence)</li>
                    <li>90 päivää (neuvottelut)</li>
                    <li>6 kuukautta (pitkät prosessit)</li>
                    <li>Pysyvä (sisäinen käyttö)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Manuaalinen hallinta</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Peruuta pääsy milloin tahansa</li>
                    <li>Päivitä vanhentumisaikaa</li>
                    <li>Muuta käyttöoikeuksia</li>
                    <li>Lisää tai poista sisältöä</li>
                  </ul>
                </div>

                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Suositus:</strong> Käytä lyhyitä vanhentumisaikoja ja pidennä tarvittaessa.
                  </AlertDescription>
                </Alert>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tracking">
            <AccordionTrigger>📊 Seuranta ja analytiikka</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Mitä voit seurata</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="border rounded p-3">
                      <h5 className="font-medium mb-1">Käyttötiedot</h5>
                      <ul className="text-sm list-disc pl-4 space-y-1">
                        <li>Kuka on avannut linkin</li>
                        <li>Milloin ja kuinka kauan</li>
                        <li>Mitä sivuja on katsottu</li>
                        <li>Kuinka monta kertaa</li>
                      </ul>
                    </div>
                    <div className="border rounded p-3">
                      <h5 className="font-medium mb-1">Vuorovaikutus</h5>
                      <ul className="text-sm list-disc pl-4 space-y-1">
                        <li>Jätetyt kommentit</li>
                        <li>Kysymykset</li>
                        <li>Ladatut dokumentit</li>
                        <li>Engagement-taso</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Raportointi</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Reaaliaikainen dashboard</li>
                    <li>Viikko- ja kuukausiraportit</li>
                    <li>Engagement-analytiikka</li>
                    <li>Kiinnostuksen mittarit</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="collaboration">
            <AccordionTrigger>💬 Yhteistyö ja kommentointi</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Kommentointijärjestelmä</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Vastaanottajat voivat jättää kommentteja ja kysymyksiä:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Kohdekohtaiset kommentit</li>
                    <li>Yleinen keskustelupalsta</li>
                    <li>Yksityiset viestit</li>
                    <li>Automaattiset ilmoitukset</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Vastausten hallinta</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Vastaa kommentteihin suoraan</li>
                    <li>Merkitse asiat käsitellyiksi</li>
                    <li>Siirrä keskustelut AI-assistentille</li>
                    <li>Vie keskustelut sähköpostiin</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Due Diligence -tuki</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Strukturoidut kysymyspohjat</li>
                    <li>Dokumenttipyynnöt</li>
                    <li>Automaattiset muistutukset</li>
                    <li>Edistymisen seuranta</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="best-practices">
            <AccordionTrigger>💡 Parhaat käytännöt</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Turvallisuus</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Käytä aina salasanasuojausta</li>
                    <li>Aseta realistinen vanhentumisaika</li>
                    <li>Rajoita IP-osoitteita tarvittaessa</li>
                    <li>Seuraa käyttöä aktiivisesti</li>
                    <li>Peruuta käyttöoikeudet heti tarpeen mukaan</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Sisällön hallinta</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Jaa vain tarvittavat tiedot</li>
                    <li>Poista arkaluonteiset tiedot</li>
                    <li>Käytä selkeitä kuvauksia</li>
                    <li>Päivitä sisältöä säännöllisesti</li>
                    <li>Versiointi ja muutosloki</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Prosessin tehokkuus</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Luo mallipohja toistuviin jakoihin</li>
                    <li>Käytä selkeitä nimeämiskäytäntöjä</li>
                    <li>Järjestä sisältö loogisesti</li>
                    <li>Anna selkeät ohjeet vastaanottajille</li>
                    <li>Seuraa ja analysoi engagement-dataa</li>
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

export default SharingHelpSection;