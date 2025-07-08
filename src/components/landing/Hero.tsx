
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HeroProps {
  handleNavigation: () => void;
  scrollToSection: (id: string) => void;
}

const Hero = ({ handleNavigation, scrollToSection }: HeroProps) => {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 modern-gradient">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="md:w-1/2 mb-12 md:mb-0 pr-0 md:pr-12"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-800 leading-tight">
              Selvitä yrityksesi arvo <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">ilmaiseksi</span>
            </h1>
            <p className="mt-6 text-xl text-slate-600 max-w-xl">
              Selvitä yrityksesi arvo ja kasvata sitä ennen myyntiä systemaattisella lähestymistavalla. Työkalumme auttaa sinua tunnistamaan arvonluonnin mahdollisuudet.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link to="/free-valuation">
                <Button 
                  size="pill"
                  variant="neumorphic-primary"
                  className="px-8 py-6 text-lg w-full sm:w-auto"
                >
                  Aloita ilmaiseksi <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                variant="neumorphic" 
                size="pill"
                className="text-slate-700 px-8 py-6 text-lg"
                onClick={() => scrollToSection("workflow")}
              >
                Näytä työnkulku
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
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-3xl transform rotate-3"></div>
              <div 
                className="relative rounded-3xl shadow-neumorphic transform -rotate-2 transition-transform hover:rotate-0 duration-500 bg-white/50 flex items-center justify-center aspect-[4/3] overflow-hidden"
              >
                <div className="text-slate-400 text-center p-8">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path>
                  </svg>
                  <p>Placeholder kuva</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
