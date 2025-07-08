
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AssessmentEmergencyResetProps {
  isEmergencyResetting: boolean;
  emergencyReset: () => void;
}

const AssessmentEmergencyReset: React.FC<AssessmentEmergencyResetProps> = ({
  isEmergencyResetting,
  emergencyReset
}) => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Alert variant="destructive" className="mb-8">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Kriittinen virhe sovelluksessa</AlertTitle>
        <AlertDescription>
          Arviointijärjestelmä on jumittunut virhetilaan, joka vaatii täydellisen nollauksen.
        </AlertDescription>
      </Alert>
      
      <Card className="w-full p-6 text-center">
        <CardHeader>
          <CardTitle>Hätänollaus vaaditaan</CardTitle>
          <CardDescription>
            Tämä toiminto tyhjentää KAIKKI sovelluksen tiedot selaimestasi ja nollaa koko järjestelmän.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="mb-6 text-muted-foreground">
            Arvioinniprosessi on jumiutunut ja tavalliset nollausyritykset eivät ole auttaneet. 
            Hätänollaus poistaa kaikki tallennetut tiedot selaimestasi, mutta ei vaikuta Supabaseen 
            tallennettuihin arviointeihin.
          </p>
          <div className="space-y-4">
            <Button 
              variant="destructive" 
              onClick={emergencyReset} 
              disabled={isEmergencyResetting}
              className="w-full flex items-center justify-center gap-2"
              size="lg"
            >
              {isEmergencyResetting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Nollataan järjestelmää...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Suorita hätänollaus
                </>
              )}
            </Button>
            
            {!isEmergencyResetting && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Palaa etusivulle ja yritä myöhemmin
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentEmergencyReset;
