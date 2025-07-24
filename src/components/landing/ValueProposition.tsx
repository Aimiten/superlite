import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ValueProposition = () => {
  const features = [
    "YTJ-data reaaliajassa",
    "Toimialan oikeat kertoimet",
    "AI-neuvoja 30 päivää",
    "PDF-raportti heti"
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Miksi Arvento?
            </h2>
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex gap-3 items-center"
                >
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <p className="font-medium text-lg">{feature}</p>
                </motion.li>
              ))}
            </ul>
            
            {/* Trust badges inline */}
            <motion.div 
              className="flex gap-3 mt-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Badge variant="outline" className="px-4 py-1">YTJ</Badge>
              <Badge variant="outline" className="px-4 py-1">GDPR</Badge>
              <Badge variant="outline" className="px-4 py-1">Suomi</Badge>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {/* Placeholder for dashboard preview image */}
            <div className="rounded-lg shadow-neumorphic overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="p-4 bg-white/80 backdrop-blur-sm border-b">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
              </div>
              <div className="p-8 space-y-4">
                <div className="h-4 bg-primary/20 rounded w-3/4"></div>
                <div className="h-4 bg-primary/20 rounded w-full"></div>
                <div className="h-4 bg-primary/20 rounded w-2/3"></div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="h-24 bg-primary/10 rounded-lg"></div>
                  <div className="h-24 bg-primary/10 rounded-lg"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;