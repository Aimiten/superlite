import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface FinalCTAProps {
  handleNavigation: () => void;
}

const FinalCTA = ({ handleNavigation }: FinalCTAProps) => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary/10">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Selvitä todellinen arvo
          </h2>
          <Button 
            size="lg" 
            className="shadow-neumorphic text-lg px-8"
            onClick={handleNavigation}
          >
            Aloita arvonmääritys
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;