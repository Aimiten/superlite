// src/pages/FreeCalculatorPage.tsx
import { Button } from "@/components/ui/button";
import { Play, ArrowRight } from "lucide-react";
import BusinessValueCalculator from '@/components/calculator/BusinessValueCalculator';
import Header from "@/components/landing/Header";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/landing/Footer";


const FreeCalculatorPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  return (
    <div>
      <Header 
        isLoggedIn={isLoggedIn}
        handleNavigation={handleNavigation}
        customLinks={[
          { label: "Etusivu", href: "/" },
          { label: "Ilmainen arvonmääritys", href: "/free-valuation" }
        ]}
        useNavigation={true}
      />
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Hero Section */}
      <div className="flex flex-col lg:flex-row gap-8 mb-12 items-center">
        <div className="w-full lg:w-1/2">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Ilmainen yrityksen <span className="text-indigo-600">arvonmäärityslaskuri</span>
          </h1>
          <p className="text-b text-slate-600">
            Saat nopean arvion yrityksesi arvosta toimialastandardien ja taloudellisten tunnuslukujen perusteella.
            Syötä vain yrityksesi Y-tunnus tai nimi aloittaaksesi.
          </p>
        </div>

        {/* Image Display */}
        <div className="w-full lg:w-1/2">
          <div className="aspect-video rounded-2xl overflow-hidden shadow-xl">
            <img 
              src="/arvento-free-calculatorin-kuva.png" 
              alt="Arvento Free Calculator Image" 
              className="w-full h-full object-cover rounded-2xl" 
              style={{ borderRadius: '1rem' }}
              loading="eager" 
              decoding="async"
            />
          </div>
        </div>
      </div>

      {/* Calculator Component */}
      <div className="mb-12">
        <BusinessValueCalculator />
      </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Miten arvonmäärityslaskuri toimii</h2>
          <p className="text-slate-600 mb-4">
            Arvonmäärityslaskurimme käyttää toimialakohtaisia kertoimia yrityksesi arvon arvioimiseksi taloudellisten tunnuslukujen perusteella.
            Laskuri tarjoaa kaksi yleistä arvonmääritysmenetelmää:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
              <h3 className="font-semibold text-indigo-900 mb-2">Liikevaihtoperusteinen menetelmä</h3>
              <p className="text-slate-700">Arvio perustuu yrityksesi vuosittaiseen liikevaihtoon. Tämä on yleinen menetelmä nopeasti kasvavilla yrityksillä, jotka eivät vielä tuota merkittävää voittoa.</p>
            </div>

            <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
              <h3 className="font-semibold text-indigo-900 mb-2">EV/EBIT-menetelmä</h3>
              <p className="text-slate-700">Arvio perustuu yrityksesi liikevoittoon (EBIT). Tämä menetelmä sopii erityisesti vakiintuneille yrityksille, joilla on tasainen tulovirta.</p>
            </div>
          </div>

          <p className="text-slate-600">
            Kattavampaa arvonmääritystä varten, joka sisältää yksityiskohtaisen analyysin ja normalisointioikaisut, 
            harkitse täyden arvonmäärityspalvelumme käyttöä.
          </p>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-8 shadow-lg mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Tarvitsetko tarkemman arvonmäärityksen?</h2>
          <p className="mb-6">
            Ilmainen laskurimme tarjoaa hyvän alkuarvion, mutta täydellinen arvonmääritys huomioi myös tulevaisuuden 
            potentiaalin, toimialan erityispiirteet ja yrityksesi yksilölliset vahvuudet.
          </p>
          <Button 
            className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-6 text-lg font-medium rounded-full shadow-md"
            onClick={() => window.location.href = 'https://tally.so/r/wQ4WOp'}
          >
            Osta tarkempi arvonmääritys
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Yrityksen arvonmäärityksen ymmärtäminen</h2>
        <p className="text-slate-600 mb-4">
          Yrityksen arvonmääritys on sekä taidetta että tiedettä. Vaikka laskurimme tarjoaa hyvän lähtökohdan,
          ammattimainen arvonmääritys huomioi monia lisätekijöitä, kuten:
        </p>
        <ul className="list-disc pl-6 text-slate-600 space-y-2">
          <li>Normalisoidut tuloksen oikaisut</li>
          <li>Kasvunäkymät ja markkinapotentiaali</li>
          <li>Kilpailuympäristön analyysi</li>
          <li>Immateriaalioikeudet ja aineettomat hyödykkeet</li>
          <li>Asiakaskeskittymät ja riskitekijät</li>
        </ul>
      </div>
    </div>

  <Footer />
      
  </div>
  );
};



export default FreeCalculatorPage;