import { motion } from "framer-motion";
import { TrendingDown, Clock, XCircle } from "lucide-react";

const ProblemContext = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Tiedätkö todellisen arvon?
            </h2>
            <div className="space-y-6">
              <motion.div 
                className="flex gap-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <TrendingDown className="h-6 w-6 text-destructive mt-0.5 flex-shrink-0" />
                <p className="font-medium text-lg">4/5 myy liian halvalla</p>
              </motion.div>
              
              <motion.div 
                className="flex gap-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Clock className="h-6 w-6 text-warning mt-0.5 flex-shrink-0" />
                <p className="font-medium text-lg">Sukupolvenvaihdos viivästyy</p>
              </motion.div>
              
              <motion.div 
                className="flex gap-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <XCircle className="h-6 w-6 text-destructive mt-0.5 flex-shrink-0" />
                <p className="font-medium text-lg">Rahoitus kariutuu</p>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Placeholder for image - will be replaced with actual image */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 shadow-neumorphic">
              <div className="space-y-4">
                <div className="h-4 bg-primary/20 rounded w-3/4"></div>
                <div className="h-4 bg-primary/20 rounded w-full"></div>
                <div className="h-4 bg-primary/20 rounded w-2/3"></div>
                <div className="mt-6 h-32 bg-primary/10 rounded-lg"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemContext;