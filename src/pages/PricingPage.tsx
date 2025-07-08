import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { callEdgeFunction } from "@/utils/edge-function";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Pricing from "@/components/landing/Pricing";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const PricingPage = () => {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const { user } = useAuth();

  const handleNavigation = () => {
    navigate("/auth");
  };

  const redirectToCheckout = async (plan: string) => {
    if (plan === "lite" || plan === "pro") {
      // Redirect to Tally form for Pro and Lite plans
      window.open("https://tally.so/r/wQ4WOp", "_blank");
      return;
    }

    /* Original Stripe checkout logic - commented out for easy restoration:
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsRedirecting(true);
    try {
      // Price IDs from Stripe Dashboard
      const priceIds: { [key: string]: string } = {
        lite_monthly: import.meta.env.VITE_STRIPE_PRICE_LITE_MONTHLY || '',
        lite_annual: import.meta.env.VITE_STRIPE_PRICE_LITE_ANNUAL || '',
        pro_monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || '',
        pro_annual: import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL || '',
      };

      const priceId = priceIds[`${plan}_${billingCycle === 'annual' ? 'annual' : 'monthly'}`];

      if (!priceId) {
        throw new Error('Price ID not configured');
      }

      const { data, error } = await callEdgeFunction('create-checkout', {
        priceId,
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
    */

    if (!user) {
      navigate("/auth");
      return;
    }

    setIsRedirecting(true);
    try {
      // Price IDs from Stripe Dashboard
      const priceIds: { [key: string]: string } = {
        lite_monthly: import.meta.env.VITE_STRIPE_PRICE_LITE_MONTHLY || '',
        lite_annual: import.meta.env.VITE_STRIPE_PRICE_LITE_ANNUAL || '',
        pro_monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || '',
        pro_annual: import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL || '',
      };

      const priceId = priceIds[`${plan}_${billingCycle === 'annual' ? 'annual' : 'monthly'}`];

      if (!priceId) {
        throw new Error('Price ID not configured');
      }

      const { data, error } = await callEdgeFunction('create-checkout', {
        priceId,
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

  // Lista ominaisuuksista vertailutaulukkoa varten
  const featureCategories = [
    {
      name: "Arvonmääritys",
      features: [
        {
          name: "Tilinpäätöstietojen analysointi",
          free: true,
          lite: true,
          pro: true,
          tooltip: "Lataa tilinpäätöstiedot PDF-muodossa automaattista analyysia varten"
        },
        {
          name: "Normalisointikysymykset",
          free: true,
          lite: true,
          pro: true,
          tooltip: "Täsmennä arvonmääritystä vastaamalla toimialakohtaisiin kysymyksiin"
        },
        {
          name: "Arvonmääritys kolmella eri menetelmällä",
          free: true,
          lite: true,
          pro: true,
          tooltip: "Saat arvonmäärityksen substanssiarvolla, tuottoarvolla ja markkinaperusteisella menetelmällä"
        },
        {
          name: "Kattava kahden tilinpäätöksen analyysi",
          free: false,
          lite: true,
          pro: true,
          tooltip: "Syvällisempi analyysi useamman vuoden tilinpäätöstiedoista"
        },
        {
          name: "Toimialavertailu",
          free: false,
          lite: true,
          pro: true,
          tooltip: "Vertailu toimialan keskimääräisiin tunnuslukuihin"
        },
        {
          name: "Arvonmäärityksen simulaattori",
          free: false,
          lite: false,
          pro: true,
          tooltip: "Kokeile eri skenaarioita ja niiden vaikutusta yrityksen arvoon"
        },
        {
          name: "Potentiaaliset ostajat ja ostajatyypit",
          free: false,
          lite: false,
          pro: true,
          tooltip: "Analyysi erilaisista ostajatyypeistä ja niiden näkemyksistä arvosta"
        }
      ]
    },
    {
      name: "Myyntikuntoisuus",
      features: [
        {
          name: "Myyntikuntoisuuden perusarviointi",
          free: false,
          lite: true,
          pro: true,
          tooltip: "Arvio yrityksen nykyisestä myyntikunnosta"
        },
        {
          name: "Myyntikunnon laaja arviointi",
          free: false,
          lite: false,
          pro: true,
          tooltip: "Syvällinen analyysi yrityksen myyntikunnosta kaikilla osa-alueilla"
        },
        {
          name: "Tehtävälista myyntikunnon parantamiseksi",
          free: false,
          lite: true,
          pro: true,
          tooltip: "Selkeät toimenpide-ehdotukset myyntikunnon parantamiseksi"
        },
        {
          name: "Arvonnousun visualisointi",
          free: false,
          lite: false,
          pro: true,
          tooltip: "Näe miten eri toimenpiteet vaikuttavat yrityksen arvoon"
        }
      ]
    },
    {
      name: "Tekoäly ja tuki",
      features: [
        {
          name: "Tekoälyavustaja",
          free: false,
          lite: true,
          pro: true,
          tooltip: "Keskustele arvonmääritykseen ja myyntikuntoon liittyvistä kysymyksistä"
        },
        {
          name: "Ääniapu",
          free: false,
          lite: false,
          pro: true,
          tooltip: "Käytä ääntä tekstin sijaan tekoälyassistentin kanssa"
        },
        {
          name: "Sähköpostituki",
          free: false,
          lite: true,
          pro: true,
          tooltip: "Tukea sähköpostitse arkisin 9-16"
        },
        {
          name: "Laajennettu asiantuntijatuki",
          free: false,
          lite: false,
          pro: true,
          tooltip: "Henkilökohtainen asiantuntijatuki puhelimitse ja sähköpostitse"
        }
      ]
    },
    {
      name: "Dokumentaatio ja jakaminen",
      features: [
        {
          name: "Perusraportti",
          free: true,
          lite: true,
          pro: true,
          tooltip: "Ladattava PDF-raportti arvonmäärityksestä"
        },
        {
          name: "Yritysesitteen luonti",
          free: false,
          lite: false,
          pro: true,
          tooltip: "Automaattisesti generoitu myyntiesite yrityksestäsi"
        },
        {
          name: "Tiedostojen tallennus",
          free: true,
          lite: true,
          pro: true,
          tooltip: "Tallenna yrityksen dokumentteja Arventon alustalle"
        },
        {
          name: "Tietojen jakaminen",
          free: false,
          lite: true,
          pro: true,
          tooltip: "Jaa arvonmääritys ja dokumentteja valituille henkilöille"
        }
      ]
    }
  ];

  // FAQ-kysymykset
  const faqItems = [
    {
      question: "Miten hinnoittelu toimii?",
      answer: "Arvento tarjoaa kolme hinnoitteluvaihtoehtoa: ilmainen perusversio, Lite kuukausimaksulla ja kattavampi Pro-versio. Voit aloittaa ilmaisella versiolla ja päivittää tarvittaessa. Hinnoittelu perustuu kuukausimaksuun ilman pitkäaikaista sitoutumista."
    },
    {
      question: "Voiko tilauksen peruuttaa milloin tahansa?",
      answer: "Kyllä, voit peruuttaa tilauksesi milloin tahansa. Veloitamme maksun kuukausittain, joten voit lopettaa palvelun käytön koska tahansa ilman lisäkustannuksia. Tilauskauden loppuun asti pääset käyttämään palvelua normaalisti."
    },
    {
      question: "Miten maksaminen tapahtuu?",
      answer: "Maksaminen tapahtuu turvallisesti luottokortilla Stripe-maksupalvelun kautta. Hyväksymme kaikki yleisimmät luottokortit. Laskutamme tilauksen automaattisesti kuukausittain, kunnes peruutat tilauksen."
    },
    {
      question: "Onko saatavilla räätälöityjä yritysratkaisuja?",
      answer: "Kyllä, tarjoamme räätälöityjä ratkaisuja yrityksille, joilla on erityistarpeita. Ota yhteyttä myyntitiimiimme keskustellaksesi yrityksellesi sopivasta ratkaisusta."
    },
    {
      question: "Mitä jos haluan vaihtaa paketista toiseen?",
      answer: "Voit vaihtaa tilaustasi milloin tahansa. Jos päivität versiota, laskutamme hintaeron seuraavan laskutusjakson alusta. Jos vaihdat edullisempaan versioon, muutos astuu voimaan nykyisen laskutusjakson päätyttyä."
    },
    {
      question: "Saanko laskun maksusta?",
      answer: "Kyllä, lähetämme jokaisesta veloituksesta kuitin sähköpostiisi. Voit myös ladata laskut tililtäsi milloin tahansa."
    }
  ];

  // Asiakastarinat
  const customerStories = [
    {
      name: "Mikko Virtanen",
      company: "TechSolutions Oy",
      image: "/customer-1.jpg",
      quote: "Arventon avulla yrityksen arvoa saatiin nostettua lähes 30% ennen myyntiä. Prosessi oli selkeä ja tehtävälista auttoi priorisoimaan toimenpiteitä.",
      results: "Yrityksen arvo nousi 30%, myyntiaika lyheni 3 kuukauteen"
    },
    {
      name: "Johanna Korhonen",
      company: "Design Studio Ky",
      image: "/customer-2.jpg",
      quote: "Pro-version myyntikuntoisuuden arviointi auttoi tunnistamaan kriittiset kehityskohteet. Tekoälyassistentti oli korvaamaton apu koko prosessin ajan.",
      results: "Löysi sopivan jatkajan 5 kuukaudessa, parempi arvostuskerroin kuin toimialalla keskimäärin"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
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
            className="text-4xl md:text-5xl font-bold text-slate-800 mb-4"
          >
            Läpinäkyvä hinnoittelu <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">jokaiselle yritykselle</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-slate-600 max-w-3xl mx-auto mb-8"
          >
            Valitse tarpeisiisi sopiva ratkaisu yrityksen arvonmääritykseen ja myyntikuntoon saattamiseen
          </motion.p>
        </div>
      </section>

      {/* Hinnoittelupaketit (Pricing-komponentti) */}
      <Pricing 
        redirectToCheckout={redirectToCheckout}
        isRedirecting={isRedirecting}
        handleNavigation={handleNavigation}
      />

      {/* Ominaisuuksien vertailutaulukko */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/80">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">Ominaisuuksien vertailu</h2>

          <Tabs defaultValue="monthly" className="w-full max-w-4xl mx-auto mb-8">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="monthly" onClick={() => setBillingCycle("monthly")}>
                Kuukausittain
              </TabsTrigger>
              <TabsTrigger value="annual" onClick={() => setBillingCycle("annual")}>
                Vuosittain (säästä 20%)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-4 px-6 text-left text-slate-700 font-medium">Ominaisuus</th>
                  <th className="py-4 px-6 text-center text-slate-700 font-medium">Free</th>
                  <th className="py-4 px-6 text-center text-slate-700 font-medium">
                    Lite
                    <div className="text-sm font-normal text-slate-500">
                      {billingCycle === "monthly" ? "29€/kk" : "279€/vuosi"}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-center text-slate-700 font-medium">
                    Pro
                    <div className="text-sm font-normal text-slate-500">
                      {billingCycle === "monthly" ? "99€/kk" : "949€/vuosi"}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureCategories.map((category, categoryIndex) => (
                  <>
                    <tr key={`category-${categoryIndex}`} className="bg-slate-100">
                      <td colSpan={4} className="py-3 px-6 font-medium text-slate-800">{category.name}</td>
                    </tr>
                    {category.features.map((feature, featureIndex) => (
                      <tr key={`feature-${categoryIndex}-${featureIndex}`} className="border-b border-slate-200">
                        <td className="py-3 px-6 text-slate-700 flex items-center">
                          {feature.name}
                          {feature.tooltip && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0">
                                    <HelpCircle className="h-4 w-4 text-slate-400" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{feature.tooltip}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </td>
                        <td className="py-3 px-6 text-center">
                          {feature.free ? 
                            <Check className="h-5 w-5 text-green-500 mx-auto" /> : 
                            <X className="h-5 w-5 text-slate-300 mx-auto" />}
                        </td>
                        <td className="py-3 px-6 text-center">
                          {feature.lite ? 
                            <Check className="h-5 w-5 text-blue-500 mx-auto" /> : 
                            <X className="h-5 w-5 text-slate-300 mx-auto" />}
                        </td>
                        <td className="py-3 px-6 text-center">
                          {feature.pro ? 
                            <Check className="h-5 w-5 text-purple-500 mx-auto" /> : 
                            <X className="h-5 w-5 text-slate-300 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ - Usein kysytyt kysymykset */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-indigo-50/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">Usein kysytyt kysymykset</h2>

          <Accordion type="single" collapsible className="bg-white rounded-xl shadow-sm">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="px-6 py-4 text-slate-800 hover:text-indigo-600">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-slate-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Asiakastarinat */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50/30 to-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-4">Mitä asiakkaamme sanovat</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto text-center mb-12">
            Arvento on auttanut satoja yrittäjiä kasvattamaan yrityksensä arvoa ja löytämään sopivan jatkajan
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {customerStories.map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-slate-100"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-slate-100 h-16 w-16 rounded-full flex items-center justify-center">
                    {story.image ? (
                      <img src={story.image} alt={story.name} className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <div className="text-2xl font-bold text-slate-400">{story.name.charAt(0)}</div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{story.name}</h3>
                    <p className="text-slate-600">{story.company}</p>
                  </div>
                </div>
                <blockquote className="text-slate-700 mb-4 italic">"{story.quote}"</blockquote>
                <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-700 font-medium">
                  Tulokset: {story.results}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Yhteydenotto */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-100 to-purple-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Tarvitsetko räätälöidyn ratkaisun?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Isommille yrityksille ja erityistarpeisiin tarjoamme räätälöityjä ratkaisuja. Ota yhteyttä myyntitiimiimme.
          </p>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full px-8 py-6 text-lg shadow-md hover:shadow-lg transition-all"
            onClick={() => window.open("mailto:sales@arvento.fi")}
          >
            Ota yhteyttä myyntiin
          </Button>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Valmis aloittamaan?</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Aloita ilmaisella arvonmäärityksellä ja päivitä tarvittaessa laajempaan versioon.
          </p>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full px-8 py-6 text-lg shadow-md hover:shadow-lg transition-all"
            onClick={handleNavigation}
          >
            Aloita ilmaiseksi
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;