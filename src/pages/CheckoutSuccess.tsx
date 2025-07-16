import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const checkSession = async () => {
      // Odota hetki että webhook ehtii käsitellä tilauksen
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Tarkista onko käyttäjä kirjautunut
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        navigate('/dashboard');
      } else {
        // Näytä kirjautumisohjeet
        setLoading(false);
      }
    };

    if (sessionId) {
      checkSession();
    }
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Käsitellään tilaustasi...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="max-w-md w-full p-8">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Tilaus onnistui!</h1>
          <p className="text-muted-foreground mb-6">
            Tervetuloa Arventon käyttäjäksi! Lähetimme sinulle sähköpostin,
            jossa on linkki salasanan asettamiseen.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Tarkista myös roskapostikansiosi, jos viestiä ei näy.
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            Siirry kirjautumaan
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CheckoutSuccess;