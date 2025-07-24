import { motion } from "framer-motion";

const HowItWorks = () => {
  const steps = [
    { number: 1, title: "Hae yritys" },
    { number: 2, title: "Täytä tiedot" },
    { number: 3, title: "Saat raportin" }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-3xl md:text-4xl font-bold mb-12"
        >
          Kolme vaihetta
        </motion.h2>
        
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
                <h3 className="font-semibold text-lg">{step.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;