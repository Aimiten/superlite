import { motion } from "framer-motion";

const HowItWorks = () => {
  const steps = [
    { 
      number: 1, 
      title: "Aloita ilmaisella arviolla",
      description: "Kirjoita Y-tunnus. Superlite hakee talousluvut ja näyttää alustavan arvion toimialasi perusteella."
    },
    { 
      number: 2, 
      title: "Tilaa täysi analyysi",
      description: "39 eurolla voit ladata tilinpäätöksen. Superlite lukee sen, kysyy tarkennuksia ja normalisoi luvut ammattimaisesti."
    },
    { 
      number: 3, 
      title: "Hyödynnä tuloksia",
      description: "Saat tarkan arvon perusteluineen. Voit jakaa sen turvallisesti, kysyä neuvoja ja seurata arvon kehitystä."
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ammattitason arvonmääritys helposti
          </h2>
          <p className="text-xl text-muted-foreground">
            Saat tuloksen minuuteissa, ei päivissä
          </p>
        </motion.div>
        
        <div className="relative">
          {/* Connecting line - desktop only */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-border hidden md:block" />
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div 
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <motion.div 
                  className="w-16 h-16 rounded-full bg-primary text-white 
                            flex items-center justify-center mx-auto mb-4 
                            relative z-10 shadow-neumorphic-primary text-xl font-bold"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {step.number}
                </motion.div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;