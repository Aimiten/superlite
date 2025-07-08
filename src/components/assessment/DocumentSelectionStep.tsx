
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
  const [file, setFile] = useState<File | null>(null);
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
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.size > 15 * 1024 * 1024) {
        setFileError("Tiedoston koko ei voi olla yli 15 MB");
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setFileError("");
      
      // Try to set a default name from the filename if empty
      if (!documentName) {
        const nameWithoutExtension = selectedFile.name.split('.').slice(0, -1).join('.');
        setDocumentName(nameWithoutExtension || selectedFile.name);
      }
    }
  };

  const handleUpload = async () => {
    if (!user || !companyId || !file) return;
    
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
      
      // Generate a unique file path for this user and company
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${companyId}/${Date.now()}.${fileExt}`;
      
      // Upload file to Storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('company_files')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Store document metadata in database
      const { data: docData, error: docError } = await supabase
        .from('company_documents')
        .insert({
          company_id: companyId,
          user_id: user.id,
          name: documentName,
          document_type: documentType,
          description: documentDescription,
          file_path: fileName,
          file_type: file.type
        })
        .select()
        .single();
      
      if (docError) throw docError;
      
      // Add to the existing documents list
      setExistingDocuments([...existingDocuments, docData as Document]);
      
      // Reset form
      setDocumentName("");
      setDocumentType("");
      setDocumentDescription("");
      setFile(null);
      
      toast({
        title: "Dokumentti ladattu",
        description: "Dokumentti on ladattu onnistuneesti.",
      });
    } catch (error: any) {
      console.error("Error uploading document:", error.message);
      toast({
        title: "Virhe",
        description: "Dokumentin lataus epäonnistui.",
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
          Valitse tai lataa dokumentteja, joita haluat käyttää myyntikuntoisuuden arvioinnissa
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
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleDocumentSelection(document)}
                  >
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{document.name}</p>
                        <p className="text-xs text-gray-500">
                          {document.document_type}
                          {document.description && ` - ${document.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center h-5 w-5 rounded border border-gray-300 justify-center">
                      {selectedDocuments.some(doc => doc.id === document.id) && (
                        <div className="h-3 w-3 bg-blue-500 rounded-sm"></div>
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
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Poista
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Valitse tiedosto tai raahaa se tähän
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF, Word, Excel, yms. (max 15 MB)
                      </p>
                      <Input
                        id="document-file"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Label htmlFor="document-file">
                        <Button variant="outline" size="sm" type="button">
                          Valitse tiedosto
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
                disabled={isUploading || !file || !documentName || !documentType}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ladataan...
                  </>
                ) : (
                  'Lataa dokumentti'
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
