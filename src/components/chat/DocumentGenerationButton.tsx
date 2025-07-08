import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";

interface DocumentGenerationButtonProps {
  isLoading: boolean;
  onClick: () => void;
}

export const DocumentGenerationButton: React.FC<DocumentGenerationButtonProps> = ({
  isLoading,
  onClick
}) => {
  return (
    <div className="flex justify-center my-4">
      <Button
        onClick={onClick}
        disabled={isLoading}
        size="lg"
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Luo dokumentti keskustelun pohjalta (2-3min)
      </Button>
    </div>
  );
};