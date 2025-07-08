
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmailCalculatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  valuationData: any; // Käytetään tyyppiä any toistaiseksi
  emailType: string; // Added emailType
}

export const EmailCalculatorDialog = ({ isOpen, onClose, valuationData, emailType }: EmailCalculatorDialogProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendEmail = async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Virheellinen sähköpostiosoite",
        description: "Tarkista, että sähköpostiosoite on oikein.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Loki datasta, joka lähetetään
      console.log("Lähetetään sähköpostia laskurin tiedoilla:", {
        email,
        valuationData,
        companyName: valuationData?.companyInfo?.name || "Yrityksesi"
      });

      const { error } = await supabase.functions.invoke("send-email-valuation", {
        body: {
          email,
          valuationData: valuationData, // Lähetetään koko valuationData-objekti sellaisenaan
          companyName: valuationData?.companyInfo?.name || "Yrityksesi",
          calculatorType: "simple", // Osoittaa että tämä on yksinkertaisen laskurin arvio
          emailType: emailType // Added emailType
        },
      });

      if (error) throw error;

      toast({
        title: "Sähköposti lähetetty!",
        description: "Arvonmääritys on lähetetty antamaasi sähköpostiosoitteeseen.",
        duration: 5000,
      });

      onClose();
    } catch (error) {
      console.error("Virhe sähköpostin lähetyksessä:", error);
      toast({
        title: "Virhe sähköpostin lähetyksessä",
        description: "Sähköpostin lähettäminen epäonnistui. Yritä myöhemmin uudelleen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lähetä arvonmääritys sähköpostiin</DialogTitle>
          <DialogDescription>
            Anna sähköpostiosoitteesi, johon arvonmäärityksen tulokset lähetetään.
            Antamalla sähköpostiosoitteesi hyväksyt {' '}
            <a 
              href="https://www.aimiten.fi/rekisteri-ja-tietosuojaseloste" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              tietosuojaselosteen ehdot
            </a>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="email" className="sr-only">
              Sähköposti
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="esimerkki@yritys.fi"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button 
            type="submit" 
            className="flex items-center gap-2"
            disabled={isLoading}
            onClick={handleSendEmail}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Lähetetään...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" /> Lähetä
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
