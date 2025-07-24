
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/utils/edge-function";
import { toast } from "@/hooks/use-toast";

// Import components
import Header from "@/components/landing/Header";
import EnhancedHero from "@/components/landing/EnhancedHero";
import TrustBar from "@/components/landing/TrustBar";
import ProblemContext from "@/components/landing/ProblemContext";
import HowItWorks from "@/components/landing/HowItWorks";
import ValueProposition from "@/components/landing/ValueProposition";
import Pricing from "@/components/landing/Pricing";
import SingleTestimonial from "@/components/landing/SingleTestimonial";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
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
    <div className="min-h-screen bg-background">
      <Header 
        isLoggedIn={isLoggedIn}
        handleNavigation={handleNavigation}
      />
      
      <EnhancedHero 
        handleNavigation={handleNavigation}
        scrollToSection={scrollToSection}
      />

      <TrustBar />

      <ProblemContext />

      <HowItWorks />

      <ValueProposition />

      <Pricing 
        redirectToCheckout={redirectToCheckout}
        isRedirecting={isRedirecting}
        handleNavigation={handleNavigation}
      />

      <SingleTestimonial />

      <FAQ />
      
      <FinalCTA
        handleNavigation={handleNavigation}
      />
      
      <Footer />
    </div>
  );
};

export default LandingPage;
