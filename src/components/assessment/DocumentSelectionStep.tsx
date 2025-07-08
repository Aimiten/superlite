import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, File, Upload, X } from "lucide-react";
import { Document } from "./types";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DocumentSelectionStepProps {
  companyId: string | null;
  handleNext: () => void;
  handlePrevious: () => void;
  onDocumentsSelected: (documents: Document[]) => void;
  standalone?: boolean;
}

const DocumentSelectionStep: React.FC<DocumentSelectionStepProps> = ({
  companyId,
  handleNext,
  handlePrevious,
  onDocumentsSelected,
  standalone = false
}) => {
  const { user } = useAuth();
  const [existingDocuments, setExistingDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchExistingDocuments();
    }
  }, [companyId]);

  useEffect(() => {
    // Update parent component with selected documents whenever they change
    onDocumentsSelected(selectedDocuments);
  }, [selectedDocuments, onDocumentsSelected]);

  const fetchExistingDocuments = async () => {
    if (!user || !companyId) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('company_documents')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;

      if (data && Array.isArray(data)) {
        setExistingDocuments(data as Document[]);
      }
    } catch (error: any) {
      console.error("Error fetching documents:", error.message);
      toast({
        title: "Virhe",
        description: "Dokumenttien haku epäonnistui.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);

      // Check file sizes
      const oversizedFiles = selectedFiles.filter(file => file.size > 15 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setFileError(`${oversizedFiles.length > 1 ? 'Joidenkin tiedostojen' : 'Tiedoston'} koko ei voi olla yli 15 MB`);
        return;
      }

      setFiles(selectedFiles);
      setFileError("");

      // Set default name from the first filename if input is empty
      if (!documentName && selectedFiles.length === 1) {
        const nameWithoutExtension = selectedFiles[0].name.split('.').slice(0, -1).join('.');
        setDocumentName(nameWithoutExtension || selectedFiles[0].name);
      }
    }
  };

  const handleUpload = async () => {
    if (!user || !companyId || files.length === 0) return;

    if (!documentName.trim()) {
      toast({
        title: "Virhe",
        description: "Anna dokumentille nimi.",
        variant: "destructive"
      });
      return;
    }

    if (!documentType) {
      toast({
        title: "Virhe",
        description: "Valitse dokumentin tyyppi.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);

      const uploadedDocs = [];

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Generate a unique file path for this user and company
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${companyId}/${Date.now()}_${i}.${fileExt}`;

        // Upload file to Storage - käytetään buckettia company-files
        const { data: fileData, error: uploadError } = await supabase.storage
          .from('company-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Create document name for multiple files
        const docName = files.length > 1 
          ? `${documentName} (${i + 1}/${files.length})` 
          : documentName;

        // Store document metadata in database
        const { data: docData, error: docError } = await supabase
          .from('company_documents')
          .insert({
            company_id: companyId,
            user_id: user.id,
            name: docName,
            document_type: documentType,
            description: documentDescription,
            file_path: fileName, // Ei lisätä company_documents/-prefiksiä
            file_type: file.type
          })
          .select()
          .single();

        if (docError) throw docError;

        uploadedDocs.push(docData as Document);
      }

      // Add to the existing documents list
      setExistingDocuments([...existingDocuments, ...uploadedDocs]);

      // Reset form
      setDocumentName("");
      setDocumentType("");
      setDocumentDescription("");
      setFiles([]);

      toast({
        title: files.length > 1 ? "Dokumentit ladattu" : "Dokumentti ladattu",
        description: files.length > 1 
          ? `${files.length} dokumenttia on ladattu onnistuneesti.` 
          : "Dokumentti on ladattu onnistuneesti.",
      });
    } catch (error: any) {
      console.error("Error uploading document:", error.message);
      toast({
        title: "Virhe",
        description: "Dokumenttien lataus epäonnistui.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleDocumentSelection = (document: Document) => {
    if (selectedDocuments.some(doc => doc.id === document.id)) {
      setSelectedDocuments(selectedDocuments.filter(doc => doc.id !== document.id));
    } else {
      setSelectedDocuments([...selectedDocuments, document]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {!standalone && (
          <h2 className="text-2xl font-bold">Dokumenttien valinta</h2>
        )}
        <p className="text-gray-600">
          Valitse tai lataa dokumentteja, joita haluat käyttää myyntikuntoisuuden arvioinnissa. Voit valita useita dokumentteja klikkaamalla niitä.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Valitse dokumentteja</CardTitle>
              <CardDescription>
                Valitse yrityksen dokumentteja, joita haluat käyttää arviointia varten
                {selectedDocuments.length > 0 && (
                  <Badge className="ml-2 bg-blue-500">
                    {selectedDocuments.length} {selectedDocuments.length === 1 ? 'valittu' : 'valittua'}
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {existingDocuments.length === 0 ? (
                <p className="text-center text-gray-500 py-6">
                  Ei tallennettuja dokumentteja
                </p>
              ) : (
                existingDocuments.map((document) => (
                  <div 
                    key={document.id}
                    className={`p-4 border rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                      selectedDocuments.some(doc => doc.id === document.id) 
                        ? 'bg-purple-100 border-purple-300' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleDocumentSelection(document)}
                  >
                    <div className="flex items-center space-x-3">
                      <File className={`h-5 w-5 ${selectedDocuments.some(doc => doc.id === document.id) ? 'text-purple-600' : 'text-blue-500'}`} />
                      <div>
                        <p className={`font-medium ${selectedDocuments.some(doc => doc.id === document.id) ? 'text-purple-800' : ''}`}>{document.name}</p>
                        <p className="text-xs text-gray-500">
                          {document.document_type}
                          {document.description && ` - ${document.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {selectedDocuments.some(doc => doc.id === document.id) && (
                        <Check className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lataa uusi dokumentti</CardTitle>
              <CardDescription>
                Lataa uusi dokumentti myyntikuntoisuuden arviointia varten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-name">Dokumentin nimi</Label>
                <Input
                  id="document-name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Esim. Liiketoimintasuunnitelma"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-type">Dokumentin tyyppi</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="document-type">
                    <SelectValue placeholder="Valitse dokumentin tyyppi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tilinpäätös">Tilinpäätös</SelectItem>
                    <SelectItem value="liiketoimintasuunnitelma">Liiketoimintasuunnitelma</SelectItem>
                    <SelectItem value="myyntimateriaali">Myyntimateriaali</SelectItem>
                    <SelectItem value="organisaatiokaavio">Organisaatiokaavio</SelectItem>
                    <SelectItem value="prosessikuvaus">Prosessikuvaus</SelectItem>
                    <SelectItem value="muu">Muu dokumentti</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-description">Kuvaus (valinnainen)</Label>
                <Textarea
                  id="document-description"
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  placeholder="Lyhyt kuvaus dokumentista"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-file">Tiedosto</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                  {files.length > 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-medium">
                        {files.length === 1 
                          ? files[0].name 
                          : `${files.length} tiedostoa valittu`}
                      </p>
                      {files.length === 1 && (
                        <p className="text-xs text-gray-500">
                          {(files[0].size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                      {files.length > 1 && (
                        <div className="max-h-20 overflow-y-auto w-full px-2">
                          {files.map((f, idx) => (
                            <div key={idx} className="text-xs text-gray-500 truncate">
                              {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                            </div>
                          ))}
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setFiles([])}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Poista kaikki
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Valitse tiedostoja tai raahaa ne tähän
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF, tekstitiedostot, data-tiedostot (max 10 MB / tiedosto)
                      </p>
                      <Input
                        id="document-file"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Label htmlFor="document-file">
                        <Button variant="outline" size="sm" type="button">
                          Valitse tiedostoja
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
                {fileError && <p className="text-sm text-red-500">{fileError}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={handleUpload}
                disabled={isUploading || files.length === 0 || !documentName || !documentType}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ladataan...
                  </>
                ) : (
                  files.length > 1 ? 'Lataa dokumentit' : 'Lataa dokumentti'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {!standalone && (
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={handlePrevious}>
            Takaisin
          </Button>
          <Button onClick={handleNext}>
            Jatka
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentSelectionStep;