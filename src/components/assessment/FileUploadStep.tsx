import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, FileText } from "lucide-react";

interface FileUploadProps {
  onFilesSelected: (files: FileList | null) => Promise<void>;
  isLoading?: boolean;
  maxFileSize?: number; // MB
  acceptedFileTypes?: string;
  instructionText?: string;
  buttonText?: string;
  multiple?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  isLoading = false,
  maxFileSize = 15, // 15MB default
  acceptedFileTypes = ".pdf,.csv,.txt",
  instructionText = "Valitse yksi tai useampi tiedosto",
  buttonText = "Selaa tiedostoja",
  multiple = true
}) => {
  const [fileError, setFileError] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Tiedoston validointi ja käsittely
  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    console.log("Käsitellään tiedostoja:", files.length);

    // Tarkista tiedostojen koot
    const oversizedFiles = files.filter(file => file.size > maxFileSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setFileError(`${oversizedFiles.length > 1 ? 'Joidenkin tiedostojen' : 'Tiedoston'} koko ei voi olla yli ${maxFileSize} MB`);
      return;
    }

    setFileError("");
    setSelectedFiles(files);

    // Luo FileList objekti manuaalisesti, koska emme voi luoda sitä suoraan
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));

    // Kutsu parent-komponentin callback
    await onFilesSelected(dataTransfer.files);
    
    // Tyhjennä input, jotta sama tiedosto voidaan valita uudelleen
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    await processFiles(files);
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
  };
  
  // Drag & drop -käsittelijät
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isLoading) return;
    
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };
  
  // Klikattaessa selauspainiketta
  const handleBrowseClick = () => {
    if (fileInputRef.current && !isLoading) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'} rounded-md p-4 flex flex-col items-center justify-center text-center space-y-2 hover:border-indigo-500 transition-colors`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className={`h-8 w-8 ${isDragging ? 'text-indigo-600' : 'text-indigo-500'} mb-2`} />

        {selectedFiles.length > 0 ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-medium">
              {selectedFiles.length === 1 
                ? selectedFiles[0].name 
                : `${selectedFiles.length} tiedostoa valittu`}
            </p>
            {selectedFiles.length === 1 && (
              <p className="text-xs text-gray-500">
                {(selectedFiles[0].size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
            {selectedFiles.length > 1 && (
              <div className="max-h-20 overflow-y-auto w-full px-2">
                {selectedFiles.map((f, idx) => (
                  <div key={idx} className="text-xs text-gray-500 truncate">
                    {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                ))}
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearFiles}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-1" />
              Poista kaikki
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              {instructionText}
            </p>
            <p className="text-xs text-gray-400">
              Tuetut tiedostotyypit: PDF, CSV, TXT (max {maxFileSize} MB / tiedosto)
            </p>
            <input
              ref={fileInputRef}
              id="file-upload-input"
              type="file"
              multiple={multiple}
              className="hidden"
              onChange={handleFileChange}
              accept={acceptedFileTypes}
              disabled={isLoading}
            />
            <Button 
              variant="outline" 
              size="sm" 
              type="button"
              disabled={isLoading}
              className="cursor-pointer"
              onClick={handleBrowseClick}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Käsitellään...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> {buttonText}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {fileError && <p className="text-sm text-red-500">{fileError}</p>}
    </div>
  );
};

export default FileUpload;