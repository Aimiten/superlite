import { motion } from "framer-motion";
import { CheckCircle2, Ban, CreditCard, Lock } from "lucide-react";

const Guarantee = () => {
  const guarantees = [
    {
      icon: <CheckCircle2 className="h-10 w-10" />,
      title: "100% tyytyväisyystakuu",
      description: "Jos et ole tyytyväinen analyysiin, palautamme rahat 14 päivän sisällä",
      highlight: true
    },
    {
      icon: <Ban className="h-10 w-10" />,
      title: "Ei pitkiä sopimuksia",
      description: "Peru milloin vain - ei 12kk sitoutumista",
      highlight: false
    },
    {
      icon: <CreditCard className="h-10 w-10" />,
      title: "Ei luottokorttia kokeiluun",
      description: "Aloita ilmaisversiolla - päätä vasta sitten",
      highlight: false
    },
    {
      icon: <Lock className="h-10 w-10" />,
      title: "Tietosi pysyvät turvassa",
      description: "Voit poistaa kaikki tiedot napin painalluksella",
      highlight: false
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Kokeile Arventoa ilman riskiä
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Haluamme että olet täysin tyytyväinen. Siksi tarjoamme markkinoiden parhaat takuut.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {guarantees.map((guarantee, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-xl p-6 transition-all duration-300 ${
                guarantee.highlight 
                  ? 'bg-primary/10 border-2 border-primary/20 shadow-neumorphic-primary hover:shadow-neumorphic-primary-pressed' 
                  : 'bg-background border border-border shadow-neumorphic hover:shadow-neumorphic-pressed'
              }`}
            >
              {guarantee.highlight && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                  SUOSITUIN
                </div>
              )}
              
              <div className="flex flex-col items-center text-center">
                <div className={`mb-4 ${guarantee.highlight ? 'text-primary' : 'text-success'}`}>
                  {guarantee.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {guarantee.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {guarantee.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-muted-foreground italic">
            * Takuu koskee Lite ja Pro -tilauksia. Ilmaisversio on aina ilmainen.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Guarantee;