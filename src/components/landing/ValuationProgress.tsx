import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Search, TrendingUp, Calculator, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LoadingStep {
  id: string;
  label: string;
  subLabel?: string;
  icon: any;
  duration: number; // milliseconds
  status: 'waiting' | 'loading' | 'done' | 'error';
}

interface ValuationProgressProps {
  isLoading: boolean;
  currentStep?: string;
  onComplete?: () => void;
}

export function ValuationProgress({ isLoading, currentStep, onComplete }: ValuationProgressProps) {
  const [steps, setSteps] = useState<LoadingStep[]>([
    {
      id: 'search',
      label: 'Haetaan yritystiedot',
      subLabel: 'YTJ-rekisteri',
      icon: Search,
      duration: 800,
      status: 'waiting'
    },
    {
      id: 'financial',
      label: 'Analysoidaan taloustiedot',
      subLabel: 'Liikevaihto, tulos, henkilöstö',
      icon: TrendingUp,
      duration: 2000,
      status: 'waiting'
    },
    {
      id: 'multipliers',
      label: 'Haetaan toimialakertoimet',
      subLabel: 'Tuoreet markkina-arvot',
      icon: Calculator,
      duration: 1500,
      status: 'waiting'
    },
    {
      id: 'ai',
      label: 'AI analysoi yrityksen',
      subLabel: 'Miksi arvokas ostajalle?',
      icon: Sparkles,
      duration: 1200,
      status: 'waiting'
    }
  ]);

  const [overallProgress, setOverallProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("Aloitetaan hakua...");

  // Fun facts to show while loading
  const funFacts = [
    "Tiesitkö? 85% yrityskaupoista tehdään strategisille ostajille",
    "Keskimääräinen PK-yritys myydään 4-6x liikevoitolla",
    "Paras myyntiaika on usein 2-3 vuotta ennen eläköitymistä",
    "Yli 50% yritysostoista epäonnistuu huonon valmistautumisen takia"
  ];

  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      // Reset when not loading
      setSteps(steps.map(s => ({ ...s, status: 'waiting' })));
      setOverallProgress(0);
      return;
    }

    // Start the loading sequence
    let currentStepIndex = 0;
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    let elapsedTime = 0;

    const progressInterval = setInterval(() => {
      elapsedTime += 50;
      const progress = (elapsedTime / totalDuration) * 100;
      setOverallProgress(Math.min(progress, 95)); // Never go to 100% until actually done
    }, 50);

    // Process each step
    const processStep = (index: number) => {
      if (index >= steps.length) {
        clearInterval(progressInterval);
        setOverallProgress(100);
        onComplete?.();
        return;
      }

      // Update step status
      setSteps(prev => prev.map((step, i) => ({
        ...step,
        status: i < index ? 'done' : i === index ? 'loading' : 'waiting'
      })));

      // Update message
      const step = steps[index];
      setCurrentMessage(step.label);

      // Move to next step after duration
      setTimeout(() => {
        setSteps(prev => prev.map((step, i) => ({
          ...step,
          status: i <= index ? 'done' : step.status
        })));
        processStep(index + 1);
      }, step.duration);
    };

    processStep(0);

    // Rotate fun facts
    const factInterval = setInterval(() => {
      setCurrentFactIndex(prev => (prev + 1) % funFacts.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(factInterval);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-neumorphic"
    >
      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Analysoidaan yritystäsi...</h3>
          <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                step.status === 'done' ? 'bg-green-50 border-green-200' :
                step.status === 'loading' ? 'bg-blue-50 border-blue-200 shadow-md' :
                'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="relative">
                {step.status === 'done' ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                ) : step.status === 'loading' ? (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <p className={`font-medium ${
                  step.status === 'loading' ? 'text-blue-900' : 
                  step.status === 'done' ? 'text-green-900' : 'text-gray-600'
                }`}>
                  {step.label}
                </p>
                {step.subLabel && (
                  <p className="text-sm text-muted-foreground">{step.subLabel}</p>
                )}
              </div>

              {step.status === 'loading' && (
                <div className="flex gap-1">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Fun fact */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentFactIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 bg-primary/5 rounded-lg border border-primary/20"
        >
          <p className="text-sm text-primary font-medium">
            💡 {funFacts[currentFactIndex]}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Bottom message */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        Tämä on ilmainen alustava arvio • Täysi arvonmääritys sisältää 20+ lisäanalyysiä
      </p>
    </motion.div>
  );
}