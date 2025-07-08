// src/components/chat/FileUploader.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FileUploaderProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isDisabled: boolean;
  isLoading: boolean;
  hasUploadedFile: boolean;
  acceptedFormats?: string; // Muutettu acceptedFormats, oli aiemmin acceptedFormats
}

const FileUploader: React.FC<FileUploaderProps> = ({
  fileInputRef,
  onFileChange,
  isDisabled,
  isLoading,
  hasUploadedFile,
  acceptedFormats = ".txt,.csv,.json,.xml,.html,.js,.ts,.jsx,.tsx,.css,.md,.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf" // Oletusformaatit
}) => {
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input 
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept={acceptedFormats}
        style={{ display: 'none' }}
      />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={handleClick}
              disabled={isLoading || isDisabled || hasUploadedFile}
              className="flex-shrink-0 rounded-full h-[50px] w-[50px]"
            >
              <Upload className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Lataa tiedosto (teksti, kuva, PDF)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
};

export default FileUploader;