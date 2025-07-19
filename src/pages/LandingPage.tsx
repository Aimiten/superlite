
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/utils/edge-function";
import { toast } from "@/hooks/use-toast";

// Import components
import Header from "@/components/landing/Header";
import EnhancedHero from "@/components/landing/EnhancedHero";
import ProblemAgitation from "@/components/landing/ProblemAgitation";
import Workflow from "@/components/landing/Workflow";
import Features from "@/components/landing/Features";
import Benefits from "@/components/landing/Benefits";
import TrustSection from "@/components/landing/TrustSection";
import Guarantee from "@/components/landing/Guarantee";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import CallToAction from "@/components/landing/CallToAction";
import Footer from "@/components/landing/Footer";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsLoggedIn(true);
      }
    };
    
    checkAuth();
  }, []);

  const handleNavigation = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const redirectToCheckout = async (plan: string) => {
    setIsRedirecting(true);
    try {
      const { data, error } = await callEdgeFunction('create-checkout', {
        priceId: import.meta.env[`VITE_STRIPE_PRICE_${plan.toUpperCase()}_MONTHLY`] || '',
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/?canceled=true`,
      });

      if (error) throw error;
      if (!data?.checkoutUrl) throw new Error('No checkout URL received');

      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Virhe",
        description: "Maksusivulle siirtyminen epäonnistui. Yritä uudelleen.",
        variant: "destructive",
      });
      setIsRedirecting(false);
    }
  };

  const scrollToSection = (id: string) => {
    if (id === "#") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      <Header 
        isLoggedIn={isLoggedIn}
        handleNavigation={handleNavigation}
      />
      
      <EnhancedHero 
        handleNavigation={handleNavigation}
        scrollToSection={scrollToSection}
      />

      <ProblemAgitation />

      <Features />

      <Benefits 
        handleNavigation={handleNavigation}
      />

      <TrustSection />

      <Guarantee />

      <Pricing 
        redirectToCheckout={redirectToCheckout}
        isRedirecting={isRedirecting}
        handleNavigation={handleNavigation}
      />

      <FAQ />
      
      <CallToAction
        handleNavigation={handleNavigation}
      />
      
      <Footer />
    </div>
  );
};

export default LandingPage;
