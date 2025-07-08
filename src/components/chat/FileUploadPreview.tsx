// src/components/chat/FileUploadPreview.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Image, FileType, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FileUploadPreviewProps {
  file: File;
  content?: string | null;
  onRemove: () => void;
}

const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({ 
  file, 
  content = null,
  onRemove 
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Luodaan kuvan URL, jos tiedosto on kuva
  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      // Jos content on jo base64-muodossa, käytä sitä
      if (content && content.startsWith('data:image/')) {
        setImageUrl(content);
      } else {
        // Luo URL objektista
        const url = URL.createObjectURL(file);
        setImageUrl(url);

        // Siivoa URL kun komponentti unmountataan
        return () => {
          URL.revokeObjectURL(url);
        };
      }
    }
  }, [file, content]);

  // Format file size to human readable format (KB/MB)
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${Math.round(sizeInBytes / 1024)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // Determine file icon based on type
  const getFileIcon = () => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4 text-primary" />;
    } else if (file.type === 'application/pdf') {
      return <FileType className="h-4 w-4 text-primary" />;
    }
    return <FileText className="h-4 w-4 text-primary" />;
  };

  // Determine if file is an image
  const isImage = file.type.startsWith('image/');

  return (
    <div className="mb-3 rounded-lg overflow-hidden bg-muted/50 border">
      {/* Näytä kuvan esikatselu, jos tiedosto on kuva */}
      {isImage && imageUrl && (
        <div className="p-2 pb-0">
          <img 
            src={imageUrl} 
            alt={file.name}
            className="w-full h-auto rounded-md object-cover max-h-64" 
          />
        </div>
      )}

      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2 overflow-hidden">
          {getFileIcon()}
          <div className="overflow-hidden">
            <div className="text-sm font-medium truncate max-w-[180px] sm:max-w-[280px]" title={file.name}>
              {file.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </div>
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRemove} 
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Poista tiedosto</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Poista tiedosto</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default FileUploadPreview;