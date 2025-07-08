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
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/utils/edge-function";

export const EmailValuationDialog = ({ isOpen, onClose, valuationResults }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendEmail = async () => {
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
      // Muodostetaan oikean muotoinen valuationData-objekti
      // Edge-funktio odottaa tiettyä rakennetta avaimille
      const valNumbers = valuationResults?.finalAnalysis?.valuation_numbers || {};
      
      // Haetaan tunnusluvut suoraan analyysistä
      const revenue = valuationResults?.finalAnalysis?.financial_data?.revenue || 0;
      const ebitda = valuationResults?.finalAnalysis?.financial_data?.ebitda || 0;
      const ebit = valuationResults?.finalAnalysis?.financial_data?.ebit || 0;
      const equity_ratio = valuationResults?.finalAnalysis?.financial_data?.equity_ratio || 0;
      
      // Varmistetaan että avaimet vastaavat edge-funktion odottamaa muotoa
      const valuationData = {
        earnings_valuation: valNumbers.ev_ebit_value || 0,
        asset_valuation: valNumbers.substanssi_value || 0,
        cash_flow_valuation: 0, // Tätä ei yleensä ole, joten käytetään 0
        comparative_valuation: valNumbers.ev_liikevaihto_value || 0,
        average_valuation: valNumbers.range?.high || 0,
        revenue: revenue,
        ebitda: ebitda,
        ebit: ebit,
        equity_ratio: equity_ratio,
        finalAnalysis: valuationResults?.finalAnalysis || {} // Lisätään koko finalAnalysis, joka sisältää suositukset
      };
      
      console.log("LÄHETETTÄVÄ DATA:", {
        email,
        valuationData,
        companyName: valuationResults.companyName
      });

      // Käytetään funktiota Edge Function -kutsun tekemiseen
      const { error } = await supabase.functions.invoke("send-email-valuation", {
        body: {
          email,
          valuationData,
          companyName: valuationResults.companyName || "Yrityksesi",
          emailType: "free_valuation"
        },
      });
      
      console.log("Supabase-funktion vastaus:", error ? `Virhe: ${JSON.stringify(error)}` : "Ei virheitä");
      
      if (error) throw error;

      toast({
        title: "Sähköposti lähetetty!",
        description: "Arvonmääritys on lähetetty antamaasi sähköpostiosoitteeseen.",
        duration: 5000,
      });

      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
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
            <a href="https://www.aimiten.fi/rekisteri-ja-tietosuojaseloste" target="_blank" rel="noopener noreferrer">
               tietosuojaselosteen ehdot.
            </a>
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
            onClick={sendEmail}
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