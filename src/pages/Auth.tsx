
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Käsitellään sähköpostivahvistus
  useEffect(() => {
    const handleEmailVerification = async () => {
      // Tarkistetaan onko kyseessä sähköpostin vahvistus
      const query = new URLSearchParams(location.search);
      const accessToken = query.get('access_token');
      const refreshToken = query.get('refresh_token');
      const type = query.get('type');

      if (type === 'recovery' || type === 'signup' || (accessToken && refreshToken)) {
        setVerifyingEmail(true);

        try {
          let session;
          
          // Suorita toimenpide tyypin perusteella
          if (accessToken && refreshToken) {
            // Tallenna session jos access token ja refresh token löytyvät
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) throw error;
            session = data.session;
          }
          
          // Vahvistuksen jälkeen ohjataan dashboard-sivulle
          if (session || type) {
            toast({
              title: "Sähköposti vahvistettu",
              description: "Sähköpostisi on nyt vahvistettu.",
            });
            navigate("/dashboard");
          }
        } catch (error: any) {
          console.error("Virhe sähköpostin vahvistuksessa:", error);
          toast({
            title: "Virhe sähköpostin vahvistuksessa",
            description: error.message || "Vahvistus epäonnistui",
            variant: "destructive",
          });
        } finally {
          setVerifyingEmail(false);
        }
      }
    };

    // Tarkistetaan istunto
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate("/dashboard");
        } else {
          // Jos ei ole aktiivista istuntoa, käsitellään mahdollinen vahvistus
          handleEmailVerification();
        }
      } catch (error) {
        console.error("Virhe istunnon tarkistuksessa:", error);
      }
    };
    
    checkSession();
  }, [navigate, location, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Virhe",
        description: "Sähköposti ja salasana vaaditaan",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Kirjautuminen onnistui",
        description: "Tervetuloa takaisin!",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Virhe kirjautumisessa",
        description: error.message || "Kirjautuminen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast({
        title: "Virhe",
        description: "Kaikki kentät vaaditaan",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
          },
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Rekisteröityminen onnistui",
        description: "Tarkista sähköpostisi vahvistaaksesi tilisi.",
      });
    } catch (error: any) {
      toast({
        title: "Virhe rekisteröitymisessä",
        description: error.message || "Rekisteröityminen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifyingEmail) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Vahvistetaan sähköpostia...</h2>
          <p className="text-muted-foreground">Odota hetki, sinut ohjataan automaattisesti eteenpäin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            className="text-muted-foreground"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Takaisin etusivulle
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-foreground mb-6">
          Arvento Lite
        </h1>
        
        <Card className="w-full">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="login">Kirjaudu</TabsTrigger>
              {/* Rekisteröityminen väliaikaisesti piilotettu */}
              {/* <TabsTrigger value="register">Rekisteröidy</TabsTrigger> */}
            </TabsList>
            
            <TabsContent value="login" className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Sähköposti</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="sinun@esimerkki.fi"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Salasana</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="●●●●●●●●"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                  disabled={loading}
                >
                  {loading ? "Kirjaudutaan..." : "Kirjaudu sisään"}
                </Button>
                
                <div className="mt-4 p-3 bg-muted rounded-lg text-muted-foreground text-center text-sm">
                  Rekisteröityminen avataan pian. Jos tarvitset pääsyn järjestelmään, ota yhteyttä ylläpitoon.
                </div>
              </form>
            </TabsContent>
            
            {/* Rekisteröitymislomake väliaikaisesti piilotettu */}
            {/* 
            <TabsContent value="register" className="p-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Koko nimi</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Matti Meikäläinen"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyName">Yrityksen nimi (valinnainen)</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Esimerkkiyritys Oy"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Sähköposti</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="sinun@esimerkki.fi"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Salasana</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="●●●●●●●●"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                  disabled={loading}
                >
                  {loading ? "Rekisteröidään..." : "Rekisteröidy"}
                </Button>
              </form>
            </TabsContent>
            */}
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
