import { useState, useEffect } from "react";
import { Shield, Lock, Flag, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchActivity {
  company: string;
  location: string;
  timestamp: Date;
}

const TrustBar = () => {
  const [latestSearch, setLatestSearch] = useState<string>("Ladataan...");
  const [isVisible, setIsVisible] = useState(true);

  // Simuloidaan live activity - oikeassa toteutuksessa haetaan Supabasesta
  useEffect(() => {
    // TODO: Toteuta oikea Supabase-integraatio
    // Tämä vaatii:
    // 1. Tallenna haut company-preview edge functionissa
    // 2. Luo Supabase-taulu hakuhistorialle
    // 3. Hae viimeisimmät anonymisoidut haut
    const mockActivities: SearchActivity[] = [
      { company: "IT-alan yritys", location: "Tampereelta", timestamp: new Date() },
      { company: "Teollisuusyritys", location: "Helsingistä", timestamp: new Date() },
      { company: "Palveluyritys", location: "Oulusta", timestamp: new Date() },
      { company: "Kaupan alan yritys", location: "Turusta", timestamp: new Date() },
    ];

    let index = 0;
    const updateActivity = () => {
      const activity = mockActivities[index % mockActivities.length];
      setLatestSearch(`${activity.company} ${activity.location}`);
      index++;
    };

    updateActivity();
    const interval = setInterval(updateActivity, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-background border-y">
      <div className="container max-w-7xl mx-auto">
        {/* Live activity ticker - piilossa mobiilissa */}
        <div className="border-b py-2 hidden md:block">
          <AnimatePresence mode="wait">
            <motion.div
              key={latestSearch}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Activity className="h-4 w-4 text-green-500 animate-pulse" />
              <span className="font-medium">Juuri nyt:</span>
              <span>{latestSearch}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Trust badges */}
        <div className="py-3 flex justify-center items-center gap-4 md:gap-6 flex-wrap px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 md:h-5 md:w-5 text-success" />
            <span className="text-xs md:text-sm font-medium">YTJ data</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 md:h-5 md:w-5 text-info" />
            <span className="text-xs md:text-sm font-medium">GDPR</span>
          </div>
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <span className="text-xs md:text-sm font-medium">Suomalainen</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustBar;