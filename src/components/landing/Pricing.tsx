import { motion } from "framer-motion";
import { Check, Sparkles, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface PricingProps {
  redirectToCheckout: (plan: string) => void;
  isRedirecting: boolean;
  handleNavigation: () => void;
}

const Pricing = ({ redirectToCheckout, isRedirecting, handleNavigation }: PricingProps) => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Yksinkertainen hinnoittelu
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Aloita ilmaisella arviolla. Saat kaikki työkalut käyttöösi yhdellä selkeällä hinnalla.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Ilmainen arvio */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full border-2 hover:border-primary/50 transition-all">
              <CardHeader className="text-center pb-6">
                <h3 className="text-2xl font-bold mb-2">Ilmainen arvio</h3>
                <div className="text-4xl font-bold text-primary mb-2">0€</div>
                <p className="text-muted-foreground">Nopea arvonmääritys yrityksellesi</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Hae yritystiedot Y-tunnuksella</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Toimialan arvostuskertoimet</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Alustava arvio 15 sekunnissa</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Tulokset sähköpostiin</span>
                  </li>
                </ul>
                <div className="pt-6">
                  <Button 
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      // Skrollaa sivun alkuun missä on hakukenttä
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      // Fokusoi hakukenttään
                      setTimeout(() => {
                        const searchInput = document.querySelector('input[placeholder*="yrityksen nimi"]');
                        if (searchInput) {
                          (searchInput as HTMLInputElement).focus();
                        }
                      }, 500);
                    }}
                  >
                    <ArrowUp className="mr-2 h-4 w-4" />
                    Kokeile ilmaiseksi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro versio */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full border-2 border-primary shadow-xl relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Suosituin
                </span>
              </div>
              <CardHeader className="text-center pb-6">
                <h3 className="text-2xl font-bold mb-2">Täysi palvelu</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-primary">39€</span>
                  <span className="text-muted-foreground ml-2">ensimmäinen kk</span>
                </div>
                <p className="text-muted-foreground">Sen jälkeen 19€/kk • Peru milloin vain</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground font-medium">Kaikki ilmaisen ominaisuudet</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Täysi arvonmääritysraportti</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">AI-assistentti 24/7</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Turvallinen jakaminen (NDA)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">DCF-kassavirtalaskelmat</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Dokumenttien analysointi</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Potentiaaliset ostajat (tulossa)</span>
                  </li>
                </ul>
                <div className="pt-6">
                  <Button 
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => navigate("/auth?redirect=checkout")}
                    disabled={isRedirecting}
                  >
                    {isRedirecting ? (
                      <>
                        <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                        Siirrytään...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Aloita nyt
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Ei vaadi luottokorttia ilmaiseen arvioon
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground">
            Kysyttävää? {" "}
            <button 
              onClick={() => navigate("/hinnoittelu")}
              className="text-primary hover:underline"
            >
              Lue usein kysytyt kysymykset →
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;