// src/components/chat/TaskDocumentHandler.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Save, FileUp, Loader2, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TaskContext, DocumentGeneration } from "./types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface TaskDocumentHandlerProps {
  taskContext: TaskContext;
  document: DocumentGeneration;
  onDocumentSaved?: () => void;
  onDownloadDocument?: (format: string) => void;
}

/**
 * Komponentti, joka mahdollistaa generoidun dokumentin tallentamisen suoraan tehtävään
 * tai lataamisen eri tiedostomuodoissa. Näytetään vain, kun käyttäjä on tullut chattiin 
 * tehtävän kautta ja dokumentti on generoitu.
 */
const TaskDocumentHandler: React.FC<TaskDocumentHandlerProps> = ({
  taskContext,
  document,
  onDocumentSaved,
  onDownloadDocument
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
  const previewContent = document?.content?.length > 500 
    ? document.content.substring(0, 500) + "..." 
    : document?.content || "";

  const handleOpenConfirmDialog = () => {
    setShowConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setShowConfirmDialog(false);
  };

  const saveToTask = async () => {
    if (!taskContext.taskId || !document || isSaving) return;

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
              text: document.content,
              generatedByAI: true,
              generatedAt: new Date().toISOString()
            }
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Dokumentti tallennettu tehtävään",
        description: "Dokumentti on tallennettu tehtävään onnistuneesti. Siirrytään tehtävälistalle 5 sekunnin kuluttua.",
      });

      setIsSaved(true);

      // Callback, jos sellainen on annettu
      if (onDocumentSaved) {
        onDocumentSaved();
      }

      // Aloita automaattinen navigointi tehtävälistalle
      setNavigateCountdown(5);
    } catch (error) {
      console.error("Error saving document to task:", error);

      // Tarkempi virheviesti ja lokitus debuggausta varten
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Tuntematon virhe";

      console.log("Document save request failed with data:", {
        taskId: taskContext.taskId,
        documentLength: document?.content?.length || 0
      });

      toast({
        title: "Virhe dokumentin tallentamisessa",
        description: `Tarkempi virhe: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = (format: string) => {
    if (onDownloadDocument) {
      onDownloadDocument(format);
    } else {
      // Fallback-toteutus, jos callback-funktiota ei ole annettu
      let downloadContent = document.content;
      let mimeType = "text/plain";
      let filename = `dokumentti-${Date.now()}`;

      if (format === "html") {
        // Yksinkertainen markdown → HTML muunnos
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Generoitu dokumentti</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #2563eb; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    th { background-color: #f1f5f9; }
    code { background-color: #f1f5f9; padding: 2px 4px; border-radius: 3px; }
  </style>
</head>
<body>
  <div id="content">
    ${downloadContent.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}
  </div>
</body>
</html>`;

        downloadContent = htmlContent;
        mimeType = "text/html";
        filename += ".html";
      } else if (format === "docx") {
        mimeType = "text/plain";
        filename += ".docx";
      } else {
        filename += ".md";
      }

      // Luo ladattava tiedosto
      const blob = new Blob([downloadContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
      <div className="border rounded-md p-4 bg-muted/30">
        <Alert className="mb-3 bg-green-50 border-green-200 text-green-800">
          <AlertDescription className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            <span>Dokumentti on valmis! Voit tallentaa sen suoraan tehtävään tai ladata eri tiedostomuodossa.</span>
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDownload('html')}
            className="gap-1"
          >
            <Download className="h-3.5 w-3.5" />
            Lataa HTML
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDownload('markdown')}
            className="gap-1"
          >
            <Download className="h-3.5 w-3.5" />
            Lataa Markdown (.md)
          </Button>

          <Button 
            variant="default" 
            size="sm"
            onClick={handleOpenConfirmDialog}
            disabled={isSaving || isSaved}
            className="gap-1"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isSaved ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isSaving ? "Tallennetaan..." : isSaved ? "Tallennettu!" : "Tallenna tehtävään"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Tehtävään tallennettu dokumentti löytyy tehtävän vastauskentästä</p>

        {/* Navigointilaskuri */}
        {navigateCountdown !== null && (
          <div className="mt-3 bg-primary/10 rounded-md p-3">
            <Alert className="mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Dokumentti tallennettu! Siirrytään tehtävälistalle {navigateCountdown} sekunnin kuluttua.
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
            <DialogTitle>Vahvista dokumentin tallennus</DialogTitle>
            <DialogDescription>
              Olet tallentamassa AI:n luomaa dokumenttia tehtävään. Tämä merkitsee tehtävän valmiiksi.
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
                Tallentamalla tämän dokumentin, merkitset tehtävän valmiiksi. Dokumentti lisätään tehtävän vastaukseksi.
                Tallennuksen jälkeen sinut ohjataan automaattisesti takaisin tehtävälistalle.
              </AlertDescription>
            </Alert>

            <div className="border rounded-md p-3 bg-muted/30 max-h-56 overflow-y-auto">
              <h4 className="text-sm font-medium mb-1">Dokumentin esikatselu:</h4>
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

export default TaskDocumentHandler;