// src/components/tasks/response/FileUploadResponse.tsx
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, FileText, X, Download, Eye, Trash, FileEdit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Textarea } from "@/components/ui/textarea";

interface FileUploadResponseProps {
  taskId: string;
  companyId?: string;
  value?: { 
    filePath?: string; 
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    uploadDate?: string;
    textResponse?: string; // Uusi kenttä tekstivastaukselle
  };
  onSave: (value: { 
    filePath: string; 
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadDate: string;
    textResponse?: string; // Uusi kenttä tekstivastaukselle
  }) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  bucketName?: string;
  disabled?: boolean;
  allowMultiple?: boolean;
  showPreview?: boolean;
}

/**
 * Component for file upload responses with option for text input
 */
const FileUploadResponse: React.FC<FileUploadResponseProps> = ({
  taskId,
  companyId = "",
  value = {},
  onSave,
  accept = "*/*",
  maxSizeMB = 10,
  label = "Tiedosto",
  bucketName = "task-files",
  disabled = false,
  allowMultiple = false,
  showPreview = true,
}) => {
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text response state
  const [textResponse, setTextResponse] = useState<string>(value?.textResponse || "");
  const [isSavingText, setIsSavingText] = useState(false);
  const [textChanged, setTextChanged] = useState(false);

  // Update text response state when value changes
  useEffect(() => {
    if (value?.textResponse !== undefined) {
      setTextResponse(value.textResponse);
      setTextChanged(false);
    }
  }, [value?.textResponse]);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const isFileTooLarge = selectedFile && selectedFile.size > maxSizeBytes;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadError(null);

      // Check file size
      if (file.size > maxSizeBytes) {
        setUploadError(`Tiedosto on liian suuri. Maksimikoko on ${maxSizeMB} MB.`);
      }
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile || isFileTooLarge) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${companyId}/${taskId}/${fileName}`;

      // Upload file to storage bucket with progress tracking
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Save response data - preserving any existing text response
      await onSave({
        filePath,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        uploadDate: new Date().toISOString(),
        textResponse // Preserve text response
      });

      // Reset state
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setUploadError(error.message || "Tiedoston lataaminen epäonnistui");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle text response
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextResponse(e.target.value);
    setTextChanged(true);
  };

  // Save text response
  const handleSaveText = async () => {
    if (!textChanged) return;

    setIsSavingText(true);
    try {
      // Tässä on tärkeä muutos: Jos tiedostoa ei ole valittu, käytä tyhjää stringiä polkuna
      // mutta varmista että myös textResponse tallennetaan
      await onSave({
        filePath: value?.filePath || "",
        fileName: value?.fileName || "",
        fileSize: value?.fileSize || 0,
        fileType: value?.fileType || "",
        uploadDate: value?.uploadDate || new Date().toISOString(),
        textResponse // Tämä tallennetaan aina
      });
      setTextChanged(false);
    } catch (error: any) {
      console.error("Error saving text response:", error);
    } finally {
      setIsSavingText(false);
    }
  };

  // Delete file
  const handleDeleteFile = async () => {
    if (!value?.filePath) return;

    try {
      // Delete file from storage
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([value.filePath]);

      if (error) throw error;

      // Clear file info but preserve text response
      await onSave({
        filePath: "",
        fileName: "",
        fileSize: 0,
        fileType: "",
        uploadDate: "",
        textResponse // Preserve text response
      });

      setIsDeleteConfirmVisible(false);
    } catch (error: any) {
      console.error("Error deleting file:", error);
      setUploadError(error.message || "Tiedoston poistaminen epäonnistui");
    }
  };

  // Open file in new tab
  const openFile = () => {
    if (!value?.filePath) return;

    const publicUrl = supabase.storage
      .from(bucketName)
      .getPublicUrl(value.filePath).data.publicUrl;

    window.open(publicUrl, '_blank');
  };

  // Cancel file selection
  const cancelUpload = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file type icon
  const getFileIcon = () => {
    const fileType = value?.fileType || "";

    if (fileType.includes("image")) return "📷";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊";
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "📑";
    if (fileType.includes("zip") || fileType.includes("compressed")) return "🗜️";
    if (fileType.includes("text")) return "📋";

    return "📎";
  };

  return (
    <div className="space-y-6">
      {/* Component label */}
      {label && (
        <Label htmlFor={`file-${taskId}`} className="text-sm font-medium">
          {label}
        </Label>
      )}

      {/* File upload section */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Lataa tiedosto</Label>
        {!value?.filePath ? (
          <>
            <div className="flex flex-col gap-2">
              <Input
                id={`file-${taskId}`}
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={accept}
                disabled={disabled || isUploading}
                className="cursor-pointer"
                multiple={allowMultiple}
              />

              {selectedFile && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className={isFileTooLarge ? "text-red-500" : ""}>
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={cancelUpload}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {uploadError && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Ladataan... {uploadProgress}%
                  </p>
                </div>
              )}

              <Button
                onClick={handleFileUpload}
                disabled={!selectedFile || isUploading || isFileTooLarge || disabled}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ladataan...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Lataa tiedosto
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Sallitut tiedostotyypit: {accept 
                ? accept.split(',').map(type => type.replace('.', '')).join(', ') 
                : "kaikki"
              }. Maksimikoko: {maxSizeMB} MB.
            </p>
          </>
        ) : (
          <div className="bg-muted rounded-md p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{getFileIcon()}</div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{value.fileName}</h4>
                {value.fileSize && (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(value.fileSize)}
                  </p>
                )}
                {value.uploadDate && (
                  <p className="text-xs text-muted-foreground">
                    Ladattu: {new Date(value.uploadDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button 
                variant="outline" 
                size="sm"
                className="gap-1.5"
                onClick={openFile}
              >
                <Download className="h-3.5 w-3.5" />
                Lataa
              </Button>

              {showPreview && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="gap-1.5"
                  onClick={openFile}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Esikatsele
                </Button>
              )}

              {!disabled && (
                isDeleteConfirmVisible ? (
                  <div className="flex gap-1">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleDeleteFile}
                    >
                      Vahvista poisto
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDeleteConfirmVisible(false)}
                    >
                      Peruuta
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setIsDeleteConfirmVisible(true)}
                  >
                    <Trash className="h-3.5 w-3.5" />
                    Poista
                  </Button>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Divider with "TAI" text */}
      <div className="flex items-center gap-2">
        <Separator className="flex-grow" />
        <span className="text-sm font-medium text-slate-500">TAI</span>
        <Separator className="flex-grow" />
      </div>

      {/* Text response section */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Kirjoita vastaus tekstinä</Label>
        <Textarea
          id={`text-${taskId}`}
          value={textResponse}
          onChange={handleTextChange}
          placeholder="Kirjoita vastauksesi tähän tekstikenttään, jos et halua ladata tiedostoa."
          className="min-h-[150px]"
          disabled={disabled || isSavingText}
        />

        {textChanged && (
          <Button 
            onClick={handleSaveText} 
            disabled={isSavingText || disabled || !textChanged}
            size="sm"
            className="gap-2"
          >
            {isSavingText ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Tallennetaan...
              </>
            ) : (
              <>
                <FileEdit className="h-4 w-4" />
                Tallenna vastaus
              </>
            )}
          </Button>
        )}

        {value?.textResponse && !textChanged && (
          <p className="text-xs text-slate-500">
            Tekstivastaus tallennettu.
          </p>
        )}
      </div>
    </div>
  );
};

export default FileUploadResponse;