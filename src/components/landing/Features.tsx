
import { motion } from "framer-motion";

const Features = () => {
  // Rotating sentences for animation
  const rotatingSentences = [
    "Teemme työstäsi helpompaa ja tehokkaampaa",
    "Säästä aikaa ja resursseja älykkäällä teknologialla",
    "Luotettava kumppani liiketoimintasi kehittämiseen"
  ];
  
  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-muted">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-slate-800">
            Ominaisuudet, jotka tekevät meistä erilaisen
          </h2>
        </motion.div>

        {/* Background decoration */}
        <div className="w-full max-w-4xl mx-auto overflow-hidden py-8 relative">
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-primary/10 shadow-neumorphic"
                style={{
                  width: `${(i + 2) * 100}px`,
                  height: `${(i + 2) * 100}px`,
                  left: `${20 + i * 10}%`,
                  top: `${30 + i * 5}%`,
                }}
                animate={{
                  x: [0, 10, 0, -10, 0],
                  y: [0, -10, 0, 10, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 10 + i * 2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          
          {/* Animated moving sentences */}
          <div className="mt-10 relative h-20 overflow-hidden">
            <motion.div
              className="absolute whitespace-nowrap"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 20,
                ease: "linear",
              }}
            >
              <div className="flex items-center space-x-16">
                {rotatingSentences.map((sentence, index) => (
                  <div key={`sentence-${index}`} className="text-lg font-medium text-primary">
                    {sentence}
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              className="absolute whitespace-nowrap"
              animate={{
                x: ["100%", "-100%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 20,
                ease: "linear",
                delay: 10,
              }}
              style={{ top: "40px" }}
            >
              <div className="flex items-center space-x-16">
                {[...rotatingSentences].reverse().map((sentence, index) => (
                  <div key={`sentence-reverse-${index}`} className="text-lg font-medium text-primary">
                    {sentence}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
