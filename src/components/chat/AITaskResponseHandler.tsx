// src/components/chat/AITaskResponseHandler.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Check, Loader2, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TaskContext } from "./types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AITaskResponseHandlerProps {
  taskContext: TaskContext;
  content: string;
  onResponseSaved?: () => void;
}

/**
 * Komponentti, joka mahdollistaa AI-vastauksen kopioimisen tehtävään.
 * Näytetään vain, kun käyttäjä on tullut chattiin tehtävän kautta.
 */
const AITaskResponseHandler: React.FC<AITaskResponseHandlerProps> = ({
  taskContext,
  content,
  onResponseSaved
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [navigateCountdown, setNavigateCountdown] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Laskuri, joka ohjaa käyttäjän tehtävälistalle tallennuksen jälkeen
  useEffect(() => {
    if (navigateCountdown !== null) {
      if (navigateCountdown <= 0) {
        navigate('/tasks');
        return;
      }

      const timer = setTimeout(() => {
        setNavigateCountdown(prev => prev !== null ? prev - 1 : null);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [navigateCountdown, navigate]);

  // Näytettävä sisältö dialogissa - lyhennä jos liian pitkä
  const previewContent = content.length > 500 
    ? content.substring(0, 500) + "..." 
    : content;

  const handleOpenConfirmDialog = () => {
    setShowConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setShowConfirmDialog(false);
  };

  const saveToTask = async () => {
    if (!taskContext.taskId || isSaving) return;

    setIsSaving(true);
    handleCloseConfirmDialog(); // Sulje dialogi

    try {
      // Kutsu update-task edge function
      const { data, error } = await supabase.functions.invoke("update-task", {
        body: {
          taskId: taskContext.taskId,
          updateData: {
            completion_status: 'completed', // Lisätään tieto siitä, että tehtävä on valmis
            value: {
              text: content,
              copiedFromAI: true,
              copiedAt: new Date().toISOString()
            }
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Vastaus tallennettu tehtävään",
        description: "AI:n vastaus on tallennettu tehtävään onnistuneesti. Siirrytään tehtävälistalle 5 sekunnin kuluttua.",
      });

      setIsSaved(true);

      // Callback, jos sellainen on annettu
      if (onResponseSaved) {
        onResponseSaved();
      }

      // Aloita automaattinen navigointi tehtävälistalle
      setNavigateCountdown(5);
    } catch (error) {
      console.error("Error saving response to task:", error);

      // Tarkempi virheviesti ja lokitus debuggausta varten
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Tuntematon virhe";

      console.log("Request failed with data:", {
        taskId: taskContext.taskId,
        content: content?.substring(0, 100) + "..." // Näytetään vain alku sisällöstä logissa
      });

      toast({
        title: "Virhe vastauksen tallentamisessa",
        description: `Tarkempi virhe: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const navigateToTaskListNow = () => {
    navigate('/tasks');
  };

  const cancelNavigation = () => {
    setNavigateCountdown(null);
  };

  return (
    <>
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Työskentelet tehtävässä: <span className="font-medium">{taskContext.taskTitle}</span>
          </p>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleOpenConfirmDialog}
                  disabled={isSaving || isSaved}
                  className="gap-1.5"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isSaved ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  {isSaving ? "Tallennetaan..." : isSaved ? "Tallennettu!" : "Tallenna tehtävään"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Kopioi tämä vastaus tehtävän tekstikenttään</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Navigointilaskuri */}
        {navigateCountdown !== null && (
          <div className="mt-3 bg-primary/10 rounded-md p-3">
            <Alert className="mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Vastaus tallennettu! Siirrytään tehtävälistalle {navigateCountdown} sekunnin kuluttua.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={cancelNavigation}
              >
                Peruuta siirtyminen
              </Button>

              <Button 
                variant="default" 
                size="sm" 
                onClick={navigateToTaskListNow}
              >
                Siirry nyt
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Varmistusdialogi */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Vahvista tehtävän tallennus</DialogTitle>
            <DialogDescription>
              Olet tallentamassa AI:n vastausta tehtävään. Tämä merkitsee tehtävän valmiiksi.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-medium">Tehtävä:</h4>
              <Badge variant="outline">{taskContext.taskTitle}</Badge>
            </div>

            <Alert className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Tallentamalla tämän vastauksen, merkitset tehtävän valmiiksi. Vastaus lisätään tehtävän tekstikenttään.
                Tallennuksen jälkeen sinut ohjataan automaattisesti takaisin tehtävälistalle.
              </AlertDescription>
            </Alert>

            <div className="border rounded-md p-3 bg-muted/30 max-h-56 overflow-y-auto">
              <h4 className="text-sm font-medium mb-1">Tallennettava sisältö:</h4>
              <p className="text-sm whitespace-pre-wrap">{previewContent}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseConfirmDialog}>Peruuta</Button>
            <Button onClick={saveToTask} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Tallennetaan...
                </>
              ) : (
                "Tallenna ja merkitse valmiiksi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AITaskResponseHandler;