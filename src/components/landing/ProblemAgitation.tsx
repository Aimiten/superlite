import { motion } from "framer-motion";
import { TrendingDown, XCircle, Clock, AlertTriangle } from "lucide-react";

const ProblemAgitation = () => {
  const problems = [
    {
      icon: <TrendingDown className="h-8 w-8" />,
      title: "Myyt 40% liian halvalla",
      description: "Tutkimus: 4/5 yrittäjästä alihinnoittelee yrityksensä ilman ammattimaista arvonmääritystä",
      example: "1M€ yritys myyty 600k€ - 400k€ menetys",
      color: "text-destructive"
    },
    {
      icon: <XCircle className="h-8 w-8" />,
      title: "Rahoitus kariutuu",
      description: "Pankit ja sijoittajat vaativat normalisoidut luvut - tilinpäätös ei riitä",
      subtext: "Ilman uskottavaa arvonmääritystä et saa rahoitusta kasvuun",
      color: "text-destructive"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Sukupolvenvaihdos viivästyy vuosilla",
      description: "Jatkaja tarvitsee rahoituksen - pankki tarvitsee arvonmäärityksen",
      example: "Keskimäärin 2 vuoden viivästys ilman valmistelua",
      color: "text-warning"
    },
    {
      icon: <AlertTriangle className="h-8 w-8" />,
      title: "Neuvottelut kaatuvat",
      description: "Ostaja kyseenalaistaa hinnan - sinulla ei ole perusteluita",
      example: "70% kaupoista kaatuu arvoerimielisyyksiin",
      color: "text-warning"
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/50">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Tiedätkö mitä tapahtuu, kun et tunne yrityksesi todellista arvoa?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Liian monet yrittäjät oppivat nämä totuudet kantapään kautta. 
            Älä anna näiden tapahtua sinulle.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-background rounded-xl p-6 shadow-neumorphic hover:shadow-neumorphic-pressed transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className={`${problem.color} mt-1`}>
                  {problem.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {problem.title}
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    {problem.description}
                  </p>
                  {problem.subtext && (
                    <p className="text-muted-foreground text-sm mb-2">
                      {problem.subtext}
                    </p>
                  )}
                  {problem.example && (
                    <p className="text-sm font-medium text-primary/80 italic">
                      {problem.example}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-lg font-medium text-foreground mb-6">
            Älä anna näiden käydä sinulle - selvitä todellinen arvosi nyt
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemAgitation;