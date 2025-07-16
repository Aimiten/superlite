import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface PricingProps {
  redirectToCheckout: (plan: string) => void;
  isRedirecting: boolean;
  handleNavigation: () => void;
}

const Pricing = ({ redirectToCheckout, isRedirecting, handleNavigation }: PricingProps) => {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState("pro");

  const pricingTiers = [
    {
      id: "free",
      name: "Free",
      price: "0",
      description: "Ilmainen kevyt arvonmääritys - selvitä yrityksesi nykyinen arvo nopeasti.",
      popular: false,
      features: [
        "Tilinpäätöstietojen analysointi",
        "Normalisointikysymykset tarkemman arvon määrittämiseksi",
        "Arvonmääritys kolmella eri menetelmällä",
        "Perusanalyysi tuloksista ja keskeiset havainnot",
      ],
      buttonText: "Aloita ilmaiseksi",
      buttonAction: () => navigate("/free-valuation"),
      headerBgClass: "bg-muted",
      titleClass: "text-primary",
      textClass: "text-primary",
      checkClass: "text-primary",
      buttonClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
    },
    {
      id: "lite",
      name: "Lite",
      price: "29",
      description: "Tarkempi arvonmääritys sekä yrityksen myyntikunnon kehittäminen.",
      popular: true,
      features: [
        "Kattava kahden tilinpäätöksen analyysi",
        "Yrityksen ja toimialan analyysi",
        "Myyntikunnon arviointi ja systemaattinen kehittäminen",
        "Tekoälyavustaja apunasi",
        "Sähköpostituki",
      ],
      buttonText: "Liity jonoon",
      buttonAction: () => window.open("https://tally.so/r/wQ4WOp", "_blank"),
      // Original Stripe action: buttonAction: () => redirectToCheckout("lite"),
      headerBgClass: "bg-primary/10",
      titleClass: "text-primary",
      textClass: "text-primary",
      checkClass: "text-primary",
      buttonClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
    },
    {
      id: "pro",
      name: "Pro",
      price: " alkaen 99",
      description: "Kattavin arvonmääritys ja kaikki mitä tarvitset yrityksesi arvon maksimointiin.",
      popular: false,
      features: [
        "Arvennon kattavin analyysi todennäköisimmästä arvosta laajoin perusteluin",
        "Arvonmääritys perustuen toimialan liikevaihtokertoimiin ja yrityskohtaisiin tekijöihin",
        "Laaja riskianalyysi ja toimenpidesuositukset",
        "Yrityksen ja toimialan laaja analyysi",
        "Myyntikunnon laaja arviointi",
        "Arvonmäärityksen simulaattori",
        "Arvonnousun visualisointi",
        "Potentiaaliset ostajat ja eri ostajatyyppien näkemys arvosta",
        "Laajennettu tuki",
      ],
      buttonText: "Liity jonoon",
      buttonAction: () => window.open("https://tally.so/r/wQ4WOp", "_blank"),
      // Original Stripe action: buttonAction: () => redirectToCheckout("pro"),
      headerBgClass: "bg-muted",
      titleClass: "text-secondary",
      textClass: "text-secondary",
      checkClass: "text-secondary",
      buttonClass: "bg-secondary hover:bg-secondary/90 text-secondary-foreground",
    }
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary">
            Teimme yrityksen arvonmäärityksestä helppoa 
          </h2>
          <p className="mt-4 text-xl text-secondary/80 max-w-3xl mx-auto">
            Selkeä ja läpinäkyvä hinnoittelu sopii kaikenkokoisille yrityksille.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.id}
              className={`overflow-hidden transform transition-all duration-300 shadow-neumorphic hover:shadow-neumorphic-pressed ${
                tier.id === selectedTier ? "ring-2 ring-primary" : ""
              }`}
              onMouseEnter={() => setSelectedTier(tier.id)}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-6 py-1 rounded-bl-lg text-sm font-medium shadow-neumorphic-primary">
                  Tulossa heinäkuussa!
                </div>
              )}
              <CardHeader className={`${tier.headerBgClass} border-b border-muted pb-6`}>
                <CardTitle className={`text-2xl font-bold ${tier.titleClass}`}>{tier.name}</CardTitle>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-extrabold text-secondary">{tier.price} €</span>
                  <span className="ml-1 text-secondary/70 font-medium">{tier.price !== "0" ? "/kk (alv 0%)" : ""}</span>
                </div>
                <CardDescription className="text-secondary/70 mt-3">
                  {tier.description}
                </CardDescription>
                <div className="mt-6">
                  <Button 
                    className={`w-full rounded-full py-5 text-lg transition-all shadow-neumorphic hover:shadow-neumorphic-pressed ${tier.buttonClass}`}
                    onClick={tier.buttonAction}
                    disabled={isRedirecting && tier.id !== "free"}
                  >
                    {isRedirecting && tier.id !== "free" ? "Ohjataan maksusivulle..." : tier.buttonText}
                  </Button>
                  <p className="text-sm text-center text-secondary/60 mt-2">
                    {tier.id !== "free" 
                      ? "Ei sitoutumisaikaa, voit peruuttaa milloin tahansa" 
                      : "Aina ilmainen - ei piilokuluja"}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <p className={`text-base font-medium mb-4 ${tier.textClass}`}>
                  {tier.id === "free" 
                    ? "Lähde liikkeelle näillä:" 
                    : tier.id === "lite" 
                      ? "Kaikki mitä Free:ssä, sekä:" 
                      : "Kaikki mitä Lite:ssä, sekä:"}
                </p>
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <Check className={`h-5 w-5 ${tier.checkClass}`} />
                      </div>
                      <span className="ml-3 text-secondary/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3 pb-6">

              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;