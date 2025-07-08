// src/hooks/useFileUpload.ts
import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast"; // Tarkista, että polku on oikea

interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
}

export function useFileUpload(options: FileUploadOptions = {}) {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options;
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tiedoston validointi - KORJATTU
  const validateFile = (file: File): boolean => {
    // Kokorajoitus
    if (file.size > maxSize) {
      toast({
        title: "Tiedosto on liian suuri",
        description: `Maksimikoko on ${Math.round(maxSize / (1024 * 1024))}MB`,
        variant: "destructive",
      });
      return false;
    }

    // Tarkistetaan tiedostotyyppi - KORJATTU LOGIIKKA
    if (allowedTypes.length > 0) {
      // Tarkistetaan ensin suora osuma
      if (allowedTypes.includes(file.type)) {
        return true;
      }

      // Tarkistetaan prefix-osuma (esim. 'image/' -> 'image/png')
      const isAllowed = allowedTypes.some(type => {
        // Jos tyyppi päättyy jo /-merkkiin, käytä sellaisenaan
        if (type.endsWith('/')) {
          return file.type.startsWith(type);
        }
        // Muussa tapauksessa lisää / loppuun jos tarkistetaan kategoriaa
        if (!type.includes('/')) {
          return file.type.startsWith(`${type}/`);
        }
        // Tarkista muuten sellaisenaan
        return file.type.startsWith(type);
      });

      if (!isAllowed) {
        // Lisää debug-viesti konsoliin, jotta näet mitkä tyypit eivät täsmää
        console.log("File type not allowed:", file.type, "Allowed types:", allowedTypes);

        toast({
          title: "Tiedostotyyppi ei ole tuettu",
          description: "Tarkista sallitut tiedostotyypit",
          variant: "destructive",
        });
        return false;
      }

      return true;
    }

    return true; // Salli kaikki tyypit jos allowedTypes on tyhjä
  };

  // Tiedoston lataaminen
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile) return;

    // Debug-viesti
    console.log("Processing file:", selectedFile.name, "Type:", selectedFile.type, "Size:", selectedFile.size);

    if (!validateFile(selectedFile)) return;

    setIsLoading(true);
    setFile(selectedFile);
    setFileType(selectedFile.type);

    // Käsitellään tiedostotyyppi oikein
    if (selectedFile.type.startsWith('text/') || 
        selectedFile.type === 'application/json' || 
        selectedFile.type === 'application/xml') {
      // Tekstitiedostot
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          setFileContent(content);
          console.log("Text file loaded successfully");
        } catch (error) {
          console.error("Error processing text file:", error);
          toast({
            title: "Virhe tiedoston käsittelyssä",
            description: "Tiedoston sisältö on virheellinen",
            variant: "destructive",
          });
          clearFile();
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast({
          title: "Tiedoston lukeminen epäonnistui",
          description: "Yritä uudelleen toisella tiedostolla",
          variant: "destructive",
        });
        clearFile();
        setIsLoading(false);
      };
      reader.readAsText(selectedFile);
    } else {
      // Kuvat ja PDF
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          setFileContent(content);
          console.log("Binary file loaded successfully as Data URL");
        } catch (error) {
          console.error("Error processing binary file:", error);
          toast({
            title: "Virhe tiedoston käsittelyssä",
            description: "Tiedoston sisältö on virheellinen",
            variant: "destructive",
          });
          clearFile();
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast({
          title: "Tiedoston lukeminen epäonnistui",
          description: "Yritä uudelleen toisella tiedostolla",
          variant: "destructive",
        });
        clearFile();
        setIsLoading(false);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Tiedoston tyhjentäminen
  const clearFile = () => {
    setFile(null);
    setFileContent(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Tiedoston latausdialogin avaaminen
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return {
    file,
    fileContent,
    fileType,
    isLoading,
    fileInputRef,
    handleFileChange,
    clearFile,
    triggerFileUpload
  };
}