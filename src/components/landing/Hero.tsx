
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeroProps {
  handleNavigation: () => void;
  scrollToSection: (id: string) => void;
}

const Hero = ({ handleNavigation, scrollToSection }: HeroProps) => {
  const isMobile = useIsMobile();
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="md:w-1/2 mb-12 md:mb-0 pr-0 md:pr-12"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Selvitä <span className="text-primary">yrityksesi arvo </span>
              helposti!
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-xl">
              Arvento on nopea ja tarkka tapa määrittää yrityksesi arvo. Tunnista arvoa nostavat tekijät ja valmistaudu onnistuneeseen yrityskauppaan.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link to={isMobile ? "/free-calculator" : "/free-valuation"}>
                <Button 
                  size="pill"
                  variant="neumorphic-primary"
                  className="px-8 py-6 text-lg w-full sm:w-auto"
                >
                  Aloita ilmaiseksi<ArrowRight className="ml-2 h-5 w-5"/>
                </Button>
              </Link>
              <Button 
                variant="neumorphic" 
                size="pill"
                className="text-foreground px-8 py-6 text-lg"
                onClick={() => scrollToSection("pricing")}
              >
                Lue lisää
              </Button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="md:w-1/2"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-3xl transform rotate-3"></div>
              <div 
                className="relative rounded-3xl shadow-neumorphic transform -rotate-2 transition-transform hover:rotate-0 duration-500 bg-white/50 flex items-center justify-center aspect-[4/3] overflow-hidden"
              >
                <img 
                  src="/arvento-nain-toimii.png" 
                  alt="Arvento - näin toimii" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
