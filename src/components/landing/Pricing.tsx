
import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface PricingProps {
  redirectToCheckout: () => void;
  isRedirecting: boolean;
  handleNavigation: () => void;
}

const Pricing = ({ redirectToCheckout, isRedirecting, handleNavigation }: PricingProps) => {
  const pricingFeatures = [
    "Myyntikuntoisuuden arviointi",
    "Arvonmäärityksen simulaattori",
    "Arvonnousun visualisointi",
    "Kaikki sovelluksen ominaisuudet",
    "Henkilökohtainen tuki",
    "Lopputulosten vienti PDF-muodossa"
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
            Hinnoittelu
          </h2>
          <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto">
            Selkeä ja läpinäkyvä hinnoittelu sopii kaikenkokoisille yrityksille
          </p>
        </motion.div>
        
        <div className="max-w-3xl mx-auto">
          <Card className="overflow-hidden transform transition-all duration-300 hover:shadow-xl">
            <div className="absolute top-0 right-0 bg-gradient-to-br from-purple-500 to-indigo-600 text-white px-6 py-1 rounded-bl-lg text-sm font-medium">
              Suosittu valinta
            </div>
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-slate-100 pb-6">
              <CardTitle className="text-3xl font-bold text-purple-700">Pro</CardTitle>
              <div className="mt-2 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900">€99</span>
                <span className="ml-1 text-slate-600 font-medium">/kuukaudessa</span>
              </div>
              <CardDescription className="text-slate-600 mt-3">
                Kaikki mitä tarvitset yrityksesi myyntikuntoon saattamiseen
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {pricingFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="ml-3 text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pb-6">
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full py-6 text-lg shadow-md hover:shadow-lg transition-all"
                onClick={redirectToCheckout}
                disabled={isRedirecting}
              >
                {isRedirecting ? "Ohjataan maksusivulle..." : "Aloita 14 päivän ilmainen kokeilu"}
              </Button>
              <p className="text-sm text-center text-slate-500 mt-2">
                Ei sitoutumisaikaa, voit peruuttaa milloin tahansa
              </p>
            </CardFooter>
          </Card>
          
          <p className="text-center mt-8 text-sm text-slate-500">
            Kokeile myös ilmaiseksi! <span className="text-purple-600 font-medium cursor-pointer hover:underline" onClick={handleNavigation}>Luo ilmainen tili</span> ja tutustu palveluun.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
