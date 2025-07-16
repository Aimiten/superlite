import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Share2, 
  MessageCircle, 
  Building2, 
  CheckCircle2,
  ArrowRight,
  Users,
  TrendingUp,
  FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ValuationNextStepsProps {
  onShare: () => void;
  valuationId?: string;
  companyName?: string;
}

const ValuationNextSteps: React.FC<ValuationNextStepsProps> = ({ 
  onShare, 
  valuationId,
  companyName 
}) => {
  const navigate = useNavigate();

  return (
    <Card className="mt-6 border-2 border-success/30 bg-success/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <CardTitle className="text-xl">Arvonmääritys valmis!</CardTitle>
        </div>
        <CardDescription>
          {companyName ? `${companyName} -yrityksen arvonmääritys on nyt valmis.` : 'Yrityksen arvonmääritys on nyt valmis.'} 
          Tässä ovat seuraavat askeleesi:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-info/10 border-info/20">
          <FileText className="h-4 w-4 text-info" />
          <AlertDescription className="text-info-foreground">
            <strong>Vinkki:</strong> Arvonmääritysraportti tallentuu automaattisesti ja voit palata siihen milloin tahansa arvonmäärityslistalta.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Jaa raportti */}
          <Card className="border hover:border-primary/50 transition-colors cursor-pointer" onClick={onShare}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <Share2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Jaa arvonmääritys</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Luo jaettava linkki raportista sijoittajille tai neuvonantajille
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Jaa raportti
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Keskustele asiantuntijan kanssa */}
          <Card className="border hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Keskustele asiantuntijan kanssa</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Saa henkilökohtaista neuvontaa arvonmäärityksestä
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/contact')}
                  >
                    Ota yhteyttä
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Myyntikunnon analyysi */}
          <Card className="border hover:border-warning/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-warning/20 p-2">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Analysoi myyntikunto</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Arvioi yrityksen valmiutta myyntiin ja tunnista kehityskohteet
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/assessment')}
                  >
                    Aloita analyysi
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vertaile toimialaan */}
          <Card className="border hover:border-success/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-success/20 p-2">
                  <Building2 className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Vertaile toimialaan</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Näe miten yrityksesi sijoittuu suhteessa muihin alan yrityksiin
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/industry-comparison')}
                  >
                    Näytä vertailu
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Suositellut toimenpiteet
          </h4>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span>Käy läpi arvonmäärityksen tulokset yrityksen johtoryhmän kanssa</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span>Tunnista ja priorisoi toimenpiteet yrityksen arvon kasvattamiseksi</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span>Päivitä arvonmääritys 6-12 kuukauden välein kehityksen seuraamiseksi</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValuationNextSteps;