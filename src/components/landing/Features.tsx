
import { motion } from "framer-motion";
import { Search, MessageSquare, FileText } from "lucide-react";

const Features = () => {
  const steps = [
    {
      number: "1",
      title: "Lataa tilinpäätökset - Arvento tunnistaa poikkeamat",
      description: "Miksi liikevaihto kasvoi 50%? Onko henkilöstökuluissa alihankintaa? Arvento löytää kohdat jotka vaativat selvennystä.",
      icon: <FileText className="h-6 w-6" />
    },
    {
      number: "2", 
      title: "Vastaa Arventon älykkäisiin kysymyksiin",
      description: "Ei lomakkeita - vain 3-6 tarkkaa kysymystä juuri sinun lukujesi poikkeamista. Kerrot vain sen mitä numeroista ei näe.",
      icon: <MessageSquare className="h-6 w-6" />
    },
    {
      number: "3",
      title: "Saat todellisen arvon normalisoiduista luvuista",
      description: "Kertaluonteiset pois, markkinaehtoinen palkka sisään. 450 000 - 670 000 € - laskettu kuudella menetelmällä.",
      icon: <Search className="h-6 w-6" />
    }
  ];
  
  return (
    <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-muted">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Arvento ymmärtää yrityksesi erityispiirteet
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Arvento tunnistaa tilinpäätöksestäsi poikkeamat, kysyy tarkentavia tietoja ja laskee todellisen arvon normalisoiduista luvuista.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-14 left-[60%] w-full h-0.5 bg-border" />
              )}
              
              <div className="bg-white rounded-xl p-6 shadow-neumorphic hover:shadow-neumorphic-pressed transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mr-4">
                    {step.number}
                  </div>
                  <div className="text-primary">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-muted-foreground">
            Tunnistaa anomaliat automaattisesti • Kysyy vain oleellisen • Normalisoi kuten konsultti
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
