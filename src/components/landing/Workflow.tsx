
import { motion } from "framer-motion";
import { 
  FileBarChart, 
  ClipboardCheck, 
  FilePlus, 
  BarChart2, 
  Bot, 
  Share2,
  FileBadge,
  ArrowRight
} from "lucide-react";

const Workflow = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const mainSteps = [
    {
      icon: <FileBarChart className="w-10 h-10 text-primary" />,
      title: "1. Yritysarviointi",
      description: "Aloita automaattisella arvonmäärityksellä ja selvitä yrityksesi nykyinen arvo.",
      color: "bg-primary/10 border-primary/20"
    },
    {
      icon: <ClipboardCheck className="w-10 h-10 text-[hsl(var(--chart-1))]" />,
      title: "2. Myyntikuntoisuus",
      description: "Arvioi yrityksesi vahvuudet ja kehityskohteet systemaattisella arvioinnilla.",
      color: "bg-[hsl(var(--chart-1))]/10 border-[hsl(var(--chart-1))]/20"
    },
    {
      icon: <FilePlus className="w-10 h-10 text-[hsl(var(--success))]" />,
      title: "3. Tehtävät",
      description: "Suorita toimenpiteitä myyntikuntoisuuden parantamiseksi ja lataa tarvittavat dokumentit.",
      color: "bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/20"
    },
    {
      icon: <BarChart2 className="w-10 h-10 text-[hsl(var(--chart-2))]" />,
      title: "4. Simulaattori",
      description: "Simuloi toimenpiteiden vaikutusta arvoon ja näe ennuste-estimaatit.",
      color: "bg-[hsl(var(--chart-2))]/10 border-[hsl(var(--chart-2))]/20"
    }
  ];

  const additionalFeatures = [
    {
      icon: <Share2 className="w-8 h-8 text-[hsl(var(--chart-3))]" />,
      title: "Yhteistyötyökalut",
      description: "Jaa raportit ja tulokset turvallisesti tiimisi tai asiantuntijoiden kanssa.",
      color: "bg-[hsl(var(--chart-3))]/10 border-[hsl(var(--chart-3))]/20"
    },
    {
      icon: <Bot className="w-8 h-8 text-[hsl(var(--chart-4))]" />,
      title: "Älykäs Myyntikuntoon-assistentti",
      description: "Keskustele assistentin kanssa, joka neuvoo yrityksesi myynnissä.",
      color: "bg-[hsl(var(--chart-4))]/10 border-[hsl(var(--chart-4))]/20"
    },
    {
      icon: <FileBadge className="w-8 h-8 text-[hsl(var(--chart-5))]" />,
      title: "Myyntiesitteen luonti",
      description: "Luo automaattisesti ammattimainen myyntiesite yrityksestäsi.",
      color: "bg-[hsl(var(--chart-5))]/10 border-[hsl(var(--chart-5))]/20"
    }
  ];

  return (
    <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Systemaattinen lähestymistapa yrityksesi myyntiin
          </h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            Neljän askeleen prosessi, joka kasvattaa yrityksesi arvoa ja parantaa myyntikuntoisuutta
          </p>
        </motion.div>

        {/* Main Process Steps - Updated Styling with Glass Effect */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative"
        >
          {/* Gradient Background Container */}
          <div className="relative bg-muted rounded-3xl p-8 shadow-neumorphic mb-12">
            <div className="absolute top-0 left-0 w-full h-full bg-background/20 backdrop-blur-sm opacity-30 rounded-3xl"></div>
            
            {/* Connecting line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border hidden lg:block -translate-y-1/2 rounded-full z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {mainSteps.map((step, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  className="group bg-background/80 backdrop-blur-sm p-6 rounded-2xl shadow-neumorphic hover:shadow-neumorphic-pressed transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="mb-4 p-3 bg-muted rounded-2xl w-16 h-16 flex items-center justify-center shadow-neumorphic group-hover:shadow-neumorphic-pressed transition-all duration-300">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                  
                  {index < mainSteps.length - 1 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-4 w-8 h-8 bg-background rounded-full shadow-neumorphic items-center justify-center z-20">
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Additional Features - Updated Styling with Glass Effect */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            Lisäominaisuudet arvon maksimoimiseen
          </h3>
          
          <div className="relative bg-muted rounded-3xl p-8 shadow-neumorphic">
            <div className="absolute top-0 left-0 w-full h-full bg-background/20 backdrop-blur-sm opacity-30 rounded-3xl"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {additionalFeatures.map((feature, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-background/80 backdrop-blur-sm p-6 rounded-2xl shadow-neumorphic hover:shadow-neumorphic-pressed transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="mb-4 p-3 bg-muted rounded-2xl w-16 h-16 flex items-center justify-center shadow-neumorphic group-hover:shadow-neumorphic-pressed transition-all duration-300">
                    {feature.icon}
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h4>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Workflow;
