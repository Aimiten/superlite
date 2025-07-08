
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Import components
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Workflow from "@/components/landing/Workflow";
import Features from "@/components/landing/Features";
import Benefits from "@/components/landing/Benefits";
import Pricing from "@/components/landing/Pricing";
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

  const redirectToCheckout = async () => {
    setIsRedirecting(true);
    setTimeout(() => {
      navigate("/auth");
      setIsRedirecting(false);
    }, 1500);
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
      
      <Hero 
        handleNavigation={handleNavigation}
        scrollToSection={scrollToSection}
      />
      
      <Workflow />
      
      <Features />
      
      <Benefits 
        handleNavigation={handleNavigation}
      />
      
      <Pricing 
        redirectToCheckout={redirectToCheckout}
        isRedirecting={isRedirecting}
        handleNavigation={handleNavigation}
      />
      
      <CallToAction 
        handleNavigation={handleNavigation}
      />
      
      <Footer />
    </div>
  );
};

export default LandingPage;
