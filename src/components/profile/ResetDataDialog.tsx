import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, AlertTriangle, Loader2, RefreshCw } from "lucide-react";

interface ResetDataDialogProps {
  disabled?: boolean;
}

const ResetDataDialog: React.FC<ResetDataDialogProps> = ({ disabled = false }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { refetch } = useCompany();
  const [isResetting, setIsResetting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [step, setStep] = useState<"warning" | "confirm">("warning");

  const handleReset = async () => {
    if (confirmText !== "POISTA KAIKKI TIEDOT") {
      toast({
        title: "Virheellinen vahvistus",
        description: "Kirjoita vahvistusteksti täsmälleen oikein",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-data', {
        body: { confirmation: "POISTA KAIKKI TIEDOT" }
      });

      if (error) throw error;

      toast({
        title: "Tiedot poistettu",
        description: data.message || "Kaikki käyttäjätietosi on poistettu onnistuneesti",
      });

      // Päivitä company-tiedot välittömästi
      refetch();

      // Sulje dialogi
      setIsOpen(false);
      
      // Ohjaa käyttäjä takaisin dashboardiin
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);

    } catch (error: any) {
      console.error('Error resetting data:', error);
      toast({
        title: "Virhe",
        description: error.message || "Tietojen poistaminen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setStep("warning");
      setConfirmText("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
          disabled={disabled}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Aloita alusta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "warning" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Aloita alusta - Poista kaikki tiedot
              </DialogTitle>
              <DialogDescription className="pt-3">
                Tämä toiminto poistaa pysyvästi kaikki tallentamasi tiedot:
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-2 py-4">
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Kaikki yritystiedot ja dokumentit</li>
                <li>• Tehdyt arvonmääritykset</li>
                <li>• Arviointianalyysit</li>
                <li>• Tehtävät ja vastaukset</li>
                <li>• Jaetut linkit ja kommentit</li>
              </ul>
              
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Säilytettävät tiedot</AlertTitle>
                <AlertDescription>
                  Keskusteluhistoriasi AI-assistentin kanssa sekä tilauksesi säilytetään. 
                  Kaikki muu tieto poistetaan pysyvästi.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Peruuta
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep("confirm")}
              >
                Jatka poistamiseen
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Vahvista tietojen poistaminen</DialogTitle>
              <DialogDescription className="pt-3">
                Vahvista, että haluat poistaa kaikki tietosi kirjoittamalla 
                alla olevaan kenttään:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-md font-mono text-sm">
                POISTA KAIKKI TIEDOT
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-text">Vahvistusteksti</Label>
                <Input
                  id="confirm-text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Kirjoita vahvistusteksti tähän"
                  className="font-mono"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setStep("warning")}
                disabled={isResetting}
              >
                Takaisin
              </Button>
              <Button
                variant="destructive"
                onClick={handleReset}
                disabled={isResetting || confirmText !== "POISTA KAIKKI TIEDOT"}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Poistetaan...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Poista kaikki tiedot
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResetDataDialog;