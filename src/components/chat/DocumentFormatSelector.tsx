import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Save } from "lucide-react";

interface DocumentFormatSelectorProps {
  onFormatSelect: (format: string, saveToTask?: boolean) => void;
}

export const DocumentFormatSelector: React.FC<DocumentFormatSelectorProps> = ({
  onFormatSelect
}) => {
  return (
    <div className="border rounded-md p-4 bg-muted/30">
      <h3 className="text-sm font-medium mb-2">Dokumentti on valmis! Valitse toiminto:</h3>
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onFormatSelect('html')}
          className="gap-1"
        >
          <Download className="h-3.5 w-3.5" />
          Lataa HTML
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onFormatSelect('docx')}
          className="gap-1"
        >
          <Download className="h-3.5 w-3.5" />
          Lataa DOCX
        </Button>

        <Button 
          variant="default" 
          size="sm"
          onClick={() => onFormatSelect('markdown', true)}
          className="gap-1"
        >
          <Save className="h-3.5 w-3.5" />
          Tallenna tehtävään
        </Button>
      </div>
    </div>
  );
};