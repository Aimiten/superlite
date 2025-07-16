import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import LandingPage from "@/pages/LandingPage";

// Komponentti, joka ohjaa käyttäjän ulkoiseen URL-osoitteeseen
const TallyRedirect = () => {
  useEffect(() => {
    window.location.href = "https://tally.so/r/wQ4WOp";
  }, []);

  return <div className="min-h-screen flex justify-center items-center">Ohjataan lomakkeeseen...</div>;
};
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import Profile from "@/pages/Profile";
import PricingPage from "@/pages/PricingPage";
import Valuation from "@/pages/Valuation";
import Sharing from "@/pages/Sharing";
import SharingManager from "@/pages/SharingManager";
import SharedView from "@/pages/SharedView";
import AIAssistant from "@/pages/AIAssistant";
import NotFound from "@/pages/NotFound";
import MainLayout from "@/components/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import FreeValuation from "@/pages/FreeValuation";
import FreeCalculatorPage from "@/pages/FreeCalculatorPage";
import AIAssistantHistory from "@/pages/AIAssistantHistory";
import TermsOfService from "@/pages/TermsOfService";
import SimplePageTransition from "@/components/SimplePageTransition";
import Help from "@/pages/Help"; // Added import
import Simulator from "@/pages/Simulator";
import DCFAnalysis from "@/pages/DCFAnalysis";
import ErrorBoundary from "@/components/ErrorBoundary";
import ColorSystemDemo from "@/pages/ColorSystemDemo";

const queryClient = new QueryClient();

// Wrapper-komponentti suojattua pääreittiä varten
const ProtectedMainLayout = ({ requireCompany = false }) => {
  return (
    <ErrorBoundary>
      <ProtectedRoute requireCompany={requireCompany}>
        <MainLayout>
          <SimplePageTransition>
            <Outlet />
          </SimplePageTransition>
        </MainLayout>
      </ProtectedRoute>
    </ErrorBoundary>
  );
};

function App() {
  useEffect(() => {
    // Google Analytics -koodi (GA4)
    const addGoogleAnalytics = () => {
      // Tarkistetaan onko tuotantoympäristö
      const isProduction = window.location.hostname !== 'localhost' && 
                          !window.location.hostname.includes('127.0.0.1') && 
                          !window.location.hostname.includes('.repl.co');

      // Lisätään Google Analytics vain tuotantoympäristössä
      if (isProduction) {
        console.log('Lisätään Google Analytics tuotantoympäristössä');

        // Tarkistetaan, onko skripti jo lisätty
        if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
          console.log('Google Analytics skripti on jo lisätty');
          return;
        }

        // Lisätään Google Analytics skripti
        const script1 = document.createElement('script');
        script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-633MSHSWRE';
        script1.async = true;

        const script2 = document.createElement('script');
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-633MSHSWRE');
        `;

        document.head.appendChild(script1);
        document.head.appendChild(script2);
      } else {
        console.log('Google Analytics ohitetaan kehitysympäristössä');
      }
    };
    // Leadfeeder-skriptin lisääminen
    const addLeadfeeder = () => {
      // Tarkistetaan onko tuotantoympäristö
      const isProduction = window.location.hostname !== 'localhost' && 
                          !window.location.hostname.includes('127.0.0.1') && 
                          !window.location.hostname.includes('.repl.co');

      // Lisätään Leadfeeder vain tuotantoympäristössä
      if (isProduction) {
        console.log('Lisätään Leadfeeder tuotantoympäristössä');

        // Tarkistetaan onko skripti jo lisätty
        if (document.querySelector('script[src*="sc.lfeeder.com"]')) {
          console.log('Leadfeeder skripti on jo lisätty');
          return;
        }

        const script = document.createElement('script');
        script.innerHTML = `
          (function(ss,ex){ window.ldfdr=window.ldfdr||function(){(ldfdr._q=ldfdr._q||[]).push([].slice.call(arguments));}; 
          (function(d,s){ fs=d.getElementsByTagName(s)[0]; function ce(src){ var cs=d.createElement(s); 
          cs.src=src; cs.async=1; fs.parentNode.insertBefore(cs,fs); }; 
          ce('https://sc.lfeeder.com/lftracker_v1_'+ss+(ex?'_'+ex:'')+'.js'); })(document,'script'); })('ywVkO4XqnrpaZ6Bj');
        `;
        script.async = true;

        document.head.appendChild(script);
        console.log('Leadfeeder skripti lisätty onnistuneesti');
      } else {
        console.log('Leadfeeder ohitetaan kehitysympäristössä');
      }
    };

    addGoogleAnalytics();
    addLeadfeeder();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CompanyProvider>
            <Router>
          <Routes>
            {/* Julkiset reitit */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/tally-signup" element={<TallyRedirect />} />
            <Route path="/free-valuation" element={<FreeValuation />} />
            <Route path="/free-calculator" element={<FreeCalculatorPage />} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
            <Route path="/shared/:shareId" element={<SharedView />} />
            <Route path="/color-system-demo" element={<ColorSystemDemo />} />

            {/* Suojatut reitit ilman yritysvaatimusta */}
            <Route element={<ProtectedMainLayout requireCompany={false} />}>
              <Route path="/dashboard" element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/ai-assistant-history" element={<AIAssistantHistory />} />
            </Route>

            {/* Suojatut reitit yritysvaatimuksella */}
            <Route element={<ProtectedMainLayout requireCompany={true} />}>
              <Route path="/valuation" element={<Valuation />} />
              <Route path="/sharing" element={<Sharing />} />
              <Route path="/sharing-manager" element={<SharingManager />} />
              <Route path="/help" element={<Help />} />
              <Route path="/simulator" element={<Simulator />} />
              <Route path="/dcf-analysis" element={<DCFAnalysis />} />
            </Route>
            <Route path="/ehdot-lite" element={<TermsOfService />} /> {/* Added route */}

            {/* 404 reitti */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
          </CompanyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;