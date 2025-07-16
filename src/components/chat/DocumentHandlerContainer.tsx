// src/components/chat/DocumentHandlerContainer.tsx
import React, { useState } from 'react';
import { TaskContext, DocumentGeneration } from './types';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  Save, 
  FileUp, 
  Loader2, 
  Check, 
  FileText 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TaskDocumentHandler from './TaskDocumentHandler';

interface DocumentHandlerContainerProps {
  taskContext: TaskContext | null;
  document: DocumentGeneration;
  onDocumentSaved?: () => void;
  onDocumentDownloaded?: (format: string) => void;
}

/**
 * Kontainerikomponentti, joka valitsee sopivan käsittelijän generoitujen dokumenttien käsittelyyn.
 * Tehtäväkontekstista riippuen näyttää joko tavallisen tai tehtäväkohtaisen dokumenttihallinnan.
 */
const DocumentHandlerContainer: React.FC<DocumentHandlerContainerProps> = ({
  taskContext,
  document,
  onDocumentSaved,
  onDocumentDownloaded
}) => {
  // Jos on tehtäväkonteksti, näytetään tehtäväkohtainen dokumenttihallinta
  if (taskContext) {
    return (
      <TaskDocumentHandler
        taskContext={taskContext}
        document={document}
        onDocumentSaved={onDocumentSaved}
        onDownloadDocument={onDocumentDownloaded}
      />
    );
  }

  // Muuten näytetään perusdokumenttihallinta (vain lataukset)
  const handleDownload = (format: string) => {
    if (onDocumentDownloaded) {
      onDocumentDownloaded(format);
    } else {
      // Fallback-toteutus
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

  return (
    <div className="border rounded-md p-4 bg-muted/30">
      <Alert className="mb-3 bg-success/10 border-success/20 text-success">
        <AlertDescription className="flex items-center gap-2">
          <FileUp className="h-4 w-4" />
          <span>Dokumentti on valmis! Voit ladata sen eri tiedostomuodossa.</span>
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
          variant="outline" 
          size="sm"
          onClick={() => handleDownload('markdown')}
          className="gap-1"
        >
          <Download className="h-3.5 w-3.5" />
          Lataa Markdown
        </Button>
      </div>
    </div>
  );
};

export default DocumentHandlerContainer;