
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

interface CallToActionProps {
  handleNavigation: () => void;
}

const CallToAction = ({ handleNavigation }: CallToActionProps) => {
  const premiumFeatures = [
    "Automaattinen yrityksenarvonmääritys",
    "Yhteistyötyökalut dokumenttien jakamiseen",
    "Myyntiesitteen luonti yrityksestäsi",
    "Älykäs Myyntikuntoon-assistentti äänituella"
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto bg-background rounded-2xl shadow-neumorphic p-12"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
          Valmis kasvattamaan yrityksesi arvoa?
        </h2>
        <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
          Aloita ilmaiseksi ja näe, kuinka paljon voit kasvattaa yrityksesi arvoa ennen myyntiä.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
          {premiumFeatures.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2 text-left text-foreground/80">
              <div className="bg-white w-6 h-6 rounded-full shadow-neumorphic flex items-center justify-center">
                <Check className="h-3 w-3 text-[hsl(var(--success))] flex-shrink-0" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>
        
        <Button 
          size="pill"
          variant="default"
          className="px-10 py-6 text-lg shadow-neumorphic hover:shadow-neumorphic-pressed transition-shadow"
          onClick={handleNavigation}
        >
          Luo ilmainen tili <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </section>
  );
};

export default CallToAction;
