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
      headerBgClass: "bg-gradient-to-r from-purple-50 to-indigo-50",
      titleClass: "text-purple-700",
      textClass: "text-purple-600",
      checkClass: "text-purple-500",
      buttonClass: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
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
      headerBgClass: "bg-gradient-to-r from-blue-50 to-cyan-50",
      titleClass: "text-blue-700",
      textClass: "text-blue-600",
      checkClass: "text-blue-500",
      buttonClass: "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700",
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
      headerBgClass: "bg-gradient-to-r from-gray-50 to-slate-50",
      titleClass: "text-slate-700",
      textClass: "text-slate-600",
      checkClass: "text-gray-500",
      buttonClass: "bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700",
    }
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/70">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800">
            Teimme yrityksen arvonmäärityksestä helppoa 
          </h2>
          <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto">
            Selkeä ja läpinäkyvä hinnoittelu sopii kaikenkokoisille yrityksille.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.id}
              className={`overflow-hidden transform transition-all duration-300 hover:shadow-xl ${
                tier.id === selectedTier ? "ring-2 ring-purple-500" : ""
              }`}
              onMouseEnter={() => setSelectedTier(tier.id)}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-br from-blue-500 to-cyan-600 text-white px-6 py-1 rounded-bl-lg text-sm font-medium">
                  Tulossa heinäkuussa!
                </div>
              )}
              <CardHeader className={`${tier.headerBgClass} border-b border-slate-100 pb-6`}>
                <CardTitle className={`text-2xl font-bold ${tier.titleClass}`}>{tier.name}</CardTitle>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-extrabold text-slate-900">{tier.price} €</span>
                  <span className="ml-1 text-slate-600 font-medium">{tier.price !== "0" ? "/kk (alv 0%)" : ""}</span>
                </div>
                <CardDescription className="text-slate-600 mt-3">
                  {tier.description}
                </CardDescription>
                <div className="mt-6">
                  <Button 
                    className={`w-full text-white rounded-full py-5 text-lg shadow-md hover:shadow-lg transition-all ${tier.buttonClass}`}
                    onClick={tier.buttonAction}
                    disabled={isRedirecting && tier.id !== "free"}
                  >
                    {isRedirecting && tier.id !== "free" ? "Ohjataan maksusivulle..." : tier.buttonText}
                  </Button>
                  <p className="text-sm text-center text-slate-500 mt-2">
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
                      <span className="ml-3 text-slate-700">{feature}</span>
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