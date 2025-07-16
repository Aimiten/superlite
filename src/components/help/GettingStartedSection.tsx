import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Building2, Calculator, CheckCircle2, FileText, Share2, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GettingStartedSection = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tervetuloa Arventoon</CardTitle>
        <CardDescription>
          Arvento on kattava työkalu yrityksesi myyntikunnon parantamiseen ja arvonmääritykseen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <AlertDescription>
            <strong>Pika-aloitus:</strong> Aloita lisäämällä yrityksesi tiedot, tee arvonmääritys ja saa automaattisesti räätälöityjä toimenpidesuosituksia myyntikunnon parantamiseksi.
          </AlertDescription>
        </Alert>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="quick-start">
            <AccordionTrigger>🚀 Pikaopas - Aloita tästä!</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <h4 className="font-semibold mb-2">3 askelta yrityksen myyntikunnon parantamiseen:</h4>
                
                <div className="border-l-4 border-primary pl-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                    <div>
                      <p className="font-medium">Lisää yrityksesi tiedot</p>
                      <p className="text-base text-muted-foreground">Hae Y-tunnuksella tai syötä manuaalisesti</p>
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-sm"
                        onClick={() => navigate("/profile")}
                      >
                        Siirry profiiliin →
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                    <div>
                      <p className="font-medium">Tee arvonmääritys</p>
                      <p className="text-sm text-muted-foreground">Lataa tilinpäätös ja saa kattava analyysi</p>
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-sm"
                        onClick={() => navigate("/valuation")}
                      >
                        Aloita arvonmääritys →
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                    <div>
                      <p className="font-medium">Paranna myyntikuntoa</p>
                      <p className="text-sm text-muted-foreground">Tee myyntikuntotesti ja seuraa tehtäviä</p>
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-sm"
                        onClick={() => navigate("/assessment")}
                      >
                        Aloita testi →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="features">
            <AccordionTrigger>📋 Kaikki ominaisuudet</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calculator className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Arvonmääritys</p>
                      <p className="text-sm text-muted-foreground">3 eri menetelmää, toimialavertailut</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Myyntikunto</p>
                      <p className="text-sm text-muted-foreground">7 osa-alueen kattava analyysi</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Tehtävät</p>
                      <p className="text-sm text-muted-foreground">Automaattiset toimenpidesuositukset</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Dokumentit</p>
                      <p className="text-sm text-muted-foreground">Generointi ja hallinta</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Share2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Jakaminen</p>
                      <p className="text-sm text-muted-foreground">Turvallinen tietojen jakaminen</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">AI-assistentti</p>
                      <p className="text-sm text-muted-foreground">24/7 apu ja neuvonta</p>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="company-setup">
            <AccordionTrigger>🏢 Yrityksen tietojen lisääminen</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Y-tunnushaku (suositeltu)</h4>
                  <ol className="list-decimal pl-6 space-y-2 text-sm">
                    <li>Mene Profiili-sivulle</li>
                    <li>Valitse "Yritykset"-välilehti</li>
                    <li>Klikkaa "Lisää yritys"</li>
                    <li>Syötä Y-tunnus ja klikkaa "Hae tiedot"</li>
                    <li>Tarkista ja täydennä tiedot</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Manuaalinen syöttö</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Jos Y-tunnushaku ei toimi tai yrityksellä ei ole Y-tunnusta:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Syötä yrityksen nimi ja toimiala</li>
                    <li>Valitse yritysmuoto (Oy, Ay, Ky, Tmi)</li>
                    <li>Lisää perustiedot kuten liikevaihto</li>
                    <li>Määritä omistajanvaihdoksen tyyppi</li>
                  </ul>
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Vinkki:</strong> Voit lisätä useita yrityksiä ja vaihtaa aktiivista yritystä työpöydän yläkulmasta.
                  </AlertDescription>
                </Alert>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="subscription">
            <AccordionTrigger>💎 Tilausversiot</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Free</h4>
                      <Badge variant="secondary">Ilmainen</Badge>
                    </div>
                    <ul className="text-sm space-y-1">
                      <li>✓ Perusarvonmääritys</li>
                      <li>✓ 1 tilinpäätös</li>
                      <li>✓ Perusraportti</li>
                      <li>✓ Dokumenttien tallennus</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 border-primary">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Lite</h4>
                      <Badge>29€/kk</Badge>
                    </div>
                    <ul className="text-sm space-y-1">
                      <li>✓ Kaikki Free-ominaisuudet</li>
                      <li>✓ 2 tilinpäätöstä</li>
                      <li>✓ Toimialavertailut</li>
                      <li>✓ Myyntikuntotesti</li>
                      <li>✓ AI-assistentti</li>
                      <li>✓ Jakamistoiminnot</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Pro</h4>
                      <Badge variant="default">99€/kk</Badge>
                    </div>
                    <ul className="text-sm space-y-1">
                      <li>✓ Kaikki Lite-ominaisuudet</li>
                      <li>✓ Simulaattori</li>
                      <li>✓ Kattava myyntikunto</li>
                      <li>✓ Arvonnousuvisualiisointi</li>
                      <li>✓ Puhe-AI</li>
                      <li>✓ Myyntiesite</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="navigation">
            <AccordionTrigger>🧭 Navigointi ja käyttöliittymä</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Päänavigaatio (vasen sivupalkki)</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li><strong>Työpöytä:</strong> Yleiskatsaus ja nopeat toiminnot</li>
                    <li><strong>Arvonmääritys:</strong> Yrityksen arvon laskenta</li>
                    <li><strong>Myyntikunto:</strong> Myyntivalmiuden arviointi</li>
                    <li><strong>Tehtävät:</strong> Toimenpidesuositukset</li>
                    <li><strong>Kysy AI:lta:</strong> AI-assistentti</li>
                    <li><strong>Jakaminen:</strong> Tietojen jakaminen</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Hyödylliset toiminnot</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li><strong>Yrityksen vaihto:</strong> Yläpalkin pudotusvalikko</li>
                    <li><strong>AI-pikakäyttö:</strong> Oikea alakulma</li>
                    <li><strong>Ilmoitukset:</strong> Kellokuvake yläpalkissa</li>
                    <li><strong>Profiili:</strong> Käyttäjäkuvake vasemmassa alareunassa</li>
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

export default GettingStartedSection;