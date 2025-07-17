import { motion } from "framer-motion";
import { Shield, Database, MapPin, Lock } from "lucide-react";

const TrustSection = () => {
  const trustItems = [
    {
      icon: <Database className="h-8 w-8" />,
      title: "YTJ-integraatio",
      description: "Haemme yritystiedot suoraan Yritys- ja yhteisötietojärjestelmästä"
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: "Tietoturva ensin",
      description: "Kaikki data käsitellään turvallisesti suomalaisilla palvelimilla"
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: "Kehitetty Suomessa",
      description: "Suomalainen palvelu suomalaisille yrityksille"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "GDPR-yhteensopiva",
      description: "Noudatamme tiukasti EU:n tietosuoja-asetusta"
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
            Turvallinen ja luotettava
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ymmärrämme, että yrityksesi talousluvut ovat arkaluonteisia. Siksi turvallisuus on meille prioriteetti.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-neumorphic hover:shadow-neumorphic-pressed transition-shadow duration-300"
            >
              <div className="text-primary mb-4">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Shield className="h-6 w-6 text-success" />
            <p className="text-sm text-muted-foreground">
              Emme tallenna arkaluonteisia tietoja ilman lupaasi
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSection;