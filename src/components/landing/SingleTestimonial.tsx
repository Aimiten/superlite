import { motion } from "framer-motion";
import { CheckCircle, Building2 } from "lucide-react";

const SingleTestimonial = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-neumorphic p-8 md:p-12"
        >
          <div className="flex items-start gap-2 mb-6">
            <CheckCircle className="h-5 w-5 text-success mt-0.5" />
            <span className="text-sm font-medium text-success">Vahvistettu asiakas</span>
          </div>
          
          <blockquote className="text-xl md:text-2xl font-medium text-foreground mb-8">
            "Arvo 40% korkeampi kuin luulin. Sain paremman hinnan."
          </blockquote>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">[Nimi]</p>
              <p className="text-sm text-muted-foreground">
                [Yritys ja toimiala]
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SingleTestimonial;