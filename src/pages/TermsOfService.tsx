
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const TermsOfService: React.FC = () => {
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      <Header 
        isLoggedIn={isLoggedIn}
        handleNavigation={handleNavigation}
      />
      
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Palvelun tilaus- ja sopimusehdot: Arvento Lite - arvonmäärityspalvelu
</h1>
        <Separator className="mb-8" />
        
        <div className="prose max-w-none">
          <p className="mb-4 text-muted-foreground">
            Viimeksi päivitetty: 29.4.2025
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Yleistä</h2>
          <p className="mb-4">
            Tämä dokumentti sisältää [Palvelun nimi] käyttöehdot. Käyttämällä palvelua hyväksyt nämä ehdot.
            Jos et hyväksy ehtoja, älä käytä palvelua. Pidätämme oikeuden muuttaa näitä ehtoja milloin tahansa.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Palvelun kuvaus</h2>
          <p className="mb-4">
            [Palvelun nimi] on verkkopalvelu, joka tarjoaa yritysten myyntikuntoisuuden arviointia ja
            arvonmääritystä. Palvelu on tarkoitettu yritysten omistajille, johtajille ja asiantuntijoille.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Käyttäjätilit</h2>
          <p className="mb-4">
            Palvelun käyttö edellyttää rekisteröitymistä. Olet vastuussa käyttäjätilisi tietojen
            salassapidosta sekä kaikesta käyttäjätililläsi tapahtuvasta toiminnasta. Sitoudut ilmoittamaan
            välittömästi, jos havaitset luvatonta käyttöä tililläsi.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Hinnoittelu ja maksut</h2>
          <p className="mb-4">
            Palvelun käyttö voi olla maksullista. Hinnat on ilmoitettu palvelussa. Pidätämme oikeuden muuttaa
            hintoja ja maksuehtoja milloin tahansa, mutta ilmoitamme muutoksista etukäteen.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Immateriaalioikeudet</h2>
          <p className="mb-4">
            Kaikki palveluun liittyvät immateriaalioikeudet, kuten tekijänoikeudet, tavaramerkit ja muut
            oikeudet, kuuluvat [Yrityksen nimi] tai sen lisenssinantajille. Palvelun käyttö ei siirrä
            minkäänlaisia oikeuksia käyttäjälle.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Vastuunrajoitus</h2>
          <p className="mb-4">
            Palvelu tarjotaan "sellaisenaan" ilman minkäänlaisia takuita. Emme vastaa mistään välittömistä,
            välillisistä, satunnaisista tai erityisistä vahingoista, jotka aiheutuvat palvelun käytöstä tai
            kyvyttömyydestä käyttää palvelua.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Sovellettava laki</h2>
          <p className="mb-4">
            Näihin käyttöehtoihin sovelletaan Suomen lakia. Kaikki erimielisyydet ratkaistaan ensisijaisesti
            neuvotteluteitse, ja toissijaisesti Helsingin käräjäoikeudessa.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Yhteystiedot</h2>
          <p className="mb-4">
            Jos sinulla on kysyttävää näistä käyttöehdoista, ota yhteyttä: [Sähköpostiosoite]
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default TermsOfService;
