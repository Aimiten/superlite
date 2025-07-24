import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { callEdgeFunction } from "@/utils/edge-function";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Sparkles, Calculator, Bot, Share2, TrendingUp, FileText, Users } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const PricingPage = () => {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { user } = useAuth();

  const handleNavigation = () => {
    navigate("/auth");
  };

  const redirectToCheckout = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsRedirecting(true);
    try {
      const monthlyPriceId = import.meta.env.VITE_STRIPE_PRICE_MONTHLY || 'price_monthly_19eur';
      const setupFeeId = import.meta.env.VITE_STRIPE_ADDON_SETUP || 'price_addon_20eur';

      const { data, error } = await callEdgeFunction('create-checkout', {
        priceId: monthlyPriceId, // 19€/kk tilaus
        addOnPriceId: setupFeeId, // 20€ lisämaksu ensimmäiselle laskulle
        userId: user.id,
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/hinnoittelu?canceled=true`,
      });

      if (error) throw error;
      if (!data?.checkoutUrl) throw new Error('No checkout URL received');

      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Virhe",
        description: "Maksusivulle siirtyminen epäonnistui. Yritä uudelleen.",
        variant: "destructive",
      });
      setIsRedirecting(false);
    }
  };

  // FAQ-kysymykset
  const faqItems = [
    {
      question: "Miten hinnoittelu toimii?",
      answer: "Maksat 39€ ensimmäisestä kuukaudesta, joka sisältää täyden arvonmääritysraportin ja kaikki ominaisuudet. Sen jälkeen palvelu jatkuu automaattisesti 19€/kk hintaan. Voit perua tilauksen milloin tahansa."
    },
    {
      question: "Mitä saan 39 eurolla?",
      answer: "Saat välittömästi täyden arvonmääritysraportin, AI-assistentin käyttöösi, mahdollisuuden jakaa tulokset turvallisesti, DCF-laskelmat ja kaikki muut ominaisuudet. Ensimmäinen kuukausi sisältää kaiken mitä tarvitset yrityksen arvon määrittämiseen."
    },
    {
      question: "Miksi jatkuva tilaus?",
      answer: "Yrityksen myynti on prosessi, joka kestää tyypillisesti 6-18 kuukautta. AI-assistentti auttaa sinua koko matkan ajan, voit päivittää arvonmääritystä ja jakaa tietoja potentiaalisille ostajille. 19€/kk on pieni investointi verrattuna yrityskaupan arvoon."
    },
    {
      question: "Voinko perua tilauksen?",
      answer: "Kyllä, voit perua tilauksen milloin tahansa. Ei pitkiä sopimuksia tai peruutusmaksuja. Jos perut, pääset käyttämään palvelua laskutuskauden loppuun asti."
    },
    {
      question: "Entä jos tarvitsen vain kertaluontoisen arvonmäärityksen?",
      answer: "Voit tilata palvelun, saada arvonmäärityksen ja perua tilauksen heti. Maksat vain 39€ ensimmäisestä kuukaudesta. Suosittelemme kuitenkin pitämään tilauksen voimassa, koska yrityksen arvoon vaikuttavat tekijät muuttuvat jatkuvasti."
    },
    {
      question: "Miten maksaminen tapahtuu?",
      answer: "Maksaminen tapahtuu turvallisesti Stripe-maksupalvelun kautta. Ensimmäinen veloitus (39€) tapahtuu heti, ja sen jälkeen 19€ veloitetaan automaattisesti kuukausittain."
    }
  ];

  // Ominaisuudet
  const features = [
    {
      icon: <Calculator className="h-5 w-5" />,
      title: "Täysi arvonmääritys",
      description: "Kattava analyysi kolmella eri menetelmällä"
    },
    {
      icon: <Bot className="h-5 w-5" />,
      title: "AI-assistentti",
      description: "Henkilökohtainen apu koko prosessin ajan"
    },
    {
      icon: <Share2 className="h-5 w-5" />,
      title: "Turvallinen jakaminen",
      description: "Jaa tulokset NDA-suojauksella halutessasi"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "DCF-laskelmat",
      description: "Kassavirta-analyysit tulevaisuuden arvosta"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Dokumenttien analysointi",
      description: "Lataa ja analysoi tilinpäätöksiä AI:lla"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Ostajahaku (tulossa)",
      description: "Löydä potentiaaliset ostajat automaattisesti"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-white to-secondary/5">
      <Header 
        isLoggedIn={false} 
        handleNavigation={handleNavigation}
        customLinks={[
          { label: "Etusivu", href: "/" },
          { label: "Ominaisuudet", href: "/#workflow" },
          { label: "Hinnoittelu", href: "/hinnoittelu" }
        ]}
        useNavigation={true}
      />

      {/* Hero-osio */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Investoi yrityksesi <span className="text-primary">arvon kasvattamiseen</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8"
          >
            39€ ensimmäinen kuukausi, sen jälkeen 19€/kk. Keskimääräinen asiakas nostaa yrityksen arvoa 15-30%.
          </motion.p>
        </div>
      </section>

      {/* Hinnoittelukortti */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-2 border-primary shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Superlite Pro</h2>
                  <div className="flex items-baseline justify-center gap-2 mb-4">
                    <span className="text-5xl font-bold text-primary">39€</span>
                    <span className="text-muted-foreground">ensimmäinen kk</span>
                  </div>
                  <p className="text-lg text-muted-foreground">Sen jälkeen 19€/kk • Peru milloin vain</p>
                </div>

                <div className="space-y-4 mb-8">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="text-primary mt-1">{feature.icon}</div>
                      <div>
                        <h3 className="font-medium text-foreground">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-white"
                  onClick={redirectToCheckout}
                  disabled={isRedirecting}
                >
                  {isRedirecting ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                      Siirrytään maksamaan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Aloita nyt
                    </>
                  )}
                </Button>

                <div className="mt-6 space-y-2 text-sm text-muted-foreground text-center">
                  <p className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    Ei pitkää sopimusta
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    Peru milloin tahansa
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    Turvallinen maksu (Stripe)
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Arvolupauskortit */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Miksi Superlite?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center p-6">
              <h3 className="font-bold text-3xl text-primary mb-2">99%</h3>
              <p className="text-muted-foreground">halvempi kuin konsultti</p>
            </Card>
            <Card className="text-center p-6">
              <h3 className="font-bold text-3xl text-primary mb-2">15 min</h3>
              <p className="text-muted-foreground">täysi arvonmääritys</p>
            </Card>
            <Card className="text-center p-6">
              <h3 className="font-bold text-3xl text-primary mb-2">24/7</h3>
              <p className="text-muted-foreground">AI-tuki käytössäsi</p>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-primary/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Usein kysytyt kysymykset</h2>

          <Accordion type="single" collapsible className="bg-white rounded-xl shadow-lg">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="px-6 py-4 text-foreground hover:text-primary">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">Valmis selvittämään yrityksesi todellisen arvon?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Aloita 39 eurolla ja saat kaikki työkalut käyttöösi välittömästi.
          </p>
          <Button 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
            onClick={redirectToCheckout}
            disabled={isRedirecting}
          >
            {isRedirecting ? "Siirrytään maksamaan..." : "Aloita arvonmääritys nyt"}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Ei vaadi luottokorttia ilmaiseen arvioon
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;