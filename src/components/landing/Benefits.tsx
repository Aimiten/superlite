
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface BenefitsProps {
  handleNavigation: () => void;
}

const Benefits = ({ handleNavigation }: BenefitsProps) => {
  const benefits = [
    "Parempi ymmärrys arvosta",
    "Suunnitelmallinen arvon kasvattaminen",
    "Paras mahdollinen myyntihinta",
    "Nopeampi myyntiprosessi",
    "Helpompi ostajien löytäminen",
  ];

  return (
    <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Määritä yrityksesi arvo ja kasvata sitä systemaattisesti.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Arvento auttaa sinua määrittämään yrityksesi arvon ja ymmärtämään mikä kaikki siihen vaikuttaa. Näin voit aloittaa yrityksesi arvon kasvattamisen systemaattisesti. Tunnistamme kriittiset tekijät, jotka vaikuttavat ostajien kiinnostukseen ja kauppahintaan.
            </p>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <CheckCircle2 className="h-6 w-6 text-[hsl(var(--success))] flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/80">{benefit}</span>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-10">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg shadow-neumorphic-primary hover:shadow-neumorphic-primary-pressed transition-all"
                onClick={handleNavigation}
                asChild
              >
                <Link to="/free-valuation">
                  Aloita ilmaiseksi <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2"
          >
            <div className="relative">
              <div className="absolute inset-x-0 -top-40 -bottom-40 bg-muted rounded-full opacity-30 blur-3xl"></div>
              <div className="relative bg-background rounded-xl shadow-neumorphic overflow-hidden">
                <img 
                  src="/arvento-desktop.jpg"
                  alt="laske yrityksesi arvo laskurilla" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
