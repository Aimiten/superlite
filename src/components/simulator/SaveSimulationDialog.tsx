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
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SaveSimulationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompany: any;
  latestValuation: any;
  multipliers: any;
  selectedMethods: any;
  futureScenario: any;
  simulationResult: any;
  baseValues: any;
  onSaved: () => void;
}

export const SaveSimulationDialog = ({
  isOpen,
  onClose,
  activeCompany,
  latestValuation,
  multipliers,
  selectedMethods,
  futureScenario,
  simulationResult,
  baseValues,
  onSaved
}: SaveSimulationDialogProps) => {
  const [simulationName, setSimulationName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!simulationName.trim()) {
      toast({
        title: "Virhe",
        description: "Anna simulaatiolle nimi",
        variant: "destructive"
      });
      return;
    }

    if (!activeCompany?.id || !latestValuation?.id) {
      toast({
        title: "Virhe", 
        description: "Puuttuvat tiedot tallennukseen",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error("Käyttäjä ei ole kirjautunut");
      }

      const { error } = await supabase
        .from('valuation_simulations')
        .insert({
          user_id: user.data.user.id,
          company_id: activeCompany.id,
          valuation_id: latestValuation.id,
          name: simulationName.trim(),
          simulation_data: {
            multipliers,
            selectedMethods,
            futureScenario,
            result: simulationResult,
            baseValues
          }
        });

      if (error) throw error;

      toast({
        title: "Tallennettu!",
        description: `Simulaatio "${simulationName}" tallennettu onnistuneesti`,
        duration: 3000,
      });

      // Reset and close
      setSimulationName("");
      onSaved(); // Reload saved simulations
      onClose();

    } catch (error) {
      console.error('Error saving simulation:', error);
      toast({
        title: "Tallentaminen epäonnistui",
        description: "Yritä myöhemmin uudelleen",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSimulationName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tallenna simulaatio</DialogTitle>
          <DialogDescription>
            Anna simulaatiolle kuvaava nimi, jotta löydät sen helposti myöhemmin.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="grid gap-2">
            <Label htmlFor="simulation-name">
              Simulaation nimi
            </Label>
            <Input
              id="simulation-name"
              type="text"
              placeholder="esim. Optimistinen skenaario"
              value={simulationName}
              onChange={(e) => setSimulationName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
              maxLength={100}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Peruuta
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isLoading || !simulationName.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tallennetaan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Tallenna
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};