// src/components/assessment/steps/InitialSelectionStep.tsx
import React, { useState, useEffect, useCallback } from "react";
import { assessmentService } from "@/utils/assessmentService";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, X, AlertTriangle, Check, FileUp, CheckSquare, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DocumentWithContent, Document } from "@/components/assessment/types"; // Oletetaan tyyppien sijainti
import FileUpload from "../FileUploadStep"; // Oletetaan sijainti
import { useToast } from "@/hooks/use-toast";
import { useAssessmentStore } from "@/stores/assessmentStore";
import { supabase } from "@/integrations/supabase/client"; // Tuodaan Supabase client
import { useCompany } from "@/hooks/use-company"; // Tuodaan useCompany hook

interface InitialSelectionStepProps {
  companyId: string | null;
  valuationId?: string | null;
  onCompanySelect?: (companyId: string, companyName: string) => Promise<string | null>; // Varmistetaan että tämä on optional
}

const InitialSelectionStep: React.FC<InitialSelectionStepProps> = ({
  companyId,
  valuationId,
  onCompanySelect // Tämä on nyt optional
}) => {
  const { toast } = useToast();
  const { activeCompany } = useCompany(); // Haetaan aktiivinen yritys

  // Assessment store: käytetään storen dokumentteja VALITTUJEN dokumenttien hallintaan
  const {
    documents: selectedDocsInStore,
    documentsStatus,
    documentsError: storeDocumentsError,
    isLoading: storeIsLoading,
    uploadDocuments: uploadDocumentsToStore,
    removeDocument: removeDocumentFromStore,
    setDocuments: updateSelectedDocsInStore, // Funktio valittujen dokumenttien päivittämiseen storeen
    startAssessment,
    sessionError: storeSessionError,
  } = useAssessmentStore();

  // Local state for ALL documents of the company
  const [allCompanyDocuments, setAllCompanyDocuments] = useState<Document[]>([]);
  const [loadingAllDocs, setLoadingAllDocs] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploadingNewDoc, setUploadingNewDoc] = useState<boolean>(false);
  const [isFileUploadVisible, setIsFileUploadVisible] = useState(false);

  // Function to fetch ALL documents for the selected company
  const fetchAllCompanyDocuments = useCallback(async () => {
    if (!companyId) {
      setAllCompanyDocuments([]); // Tyhjennä lista jos companyId puuttuu
      return;
    }

    setLoadingAllDocs(true);
    setLocalError(null);
    try {
      console.log(`[InitialSelectionStep] Fetching all documents for company: ${companyId}`);
      const { data, error } = await supabase
        .from('company_documents')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`[InitialSelectionStep] Found ${data?.length || 0} total documents for company.`);
      setAllCompanyDocuments((data || []) as Document[]); // Varmistetaan tyypitys
    } catch (err: any) {
      console.error("Error fetching all company documents:", err);
      setLocalError("Kaikkien dokumenttien haku epäonnistui");
      toast({
        title: "Virhe",
        description: "Kaikkien dokumenttien haku epäonnistui",
        variant: "destructive"
      });
    } finally {
      setLoadingAllDocs(false);
    }
  }, [companyId, toast]);

  // Fetch all documents when companyId changes or the component mounts with a companyId
  useEffect(() => {
    fetchAllCompanyDocuments();
  }, [fetchAllCompanyDocuments]);

  // Function to check if a document (from the full list) is currently selected in the store
  const isDocumentSelected = useCallback((docId: string): boolean => {
    return selectedDocsInStore.some(d => d.id === docId);
  }, [selectedDocsInStore]);

  // Function to handle selecting/deselecting a document
  const toggleDocumentSelection = useCallback(async (document: Document) => {
    const currentlySelected = isDocumentSelected(document.id);
    let updatedSelectedDocs;

    console.log(`[InitialSelectionStep] Toggling document: ${document.name} (ID: ${document.id}). Currently selected: ${currentlySelected}`);

    if (currentlySelected) {
      // Remove from store
      updatedSelectedDocs = selectedDocsInStore.filter(d => d.id !== document.id);
      console.log(`[InitialSelectionStep] Document removed. New selected count: ${updatedSelectedDocs.length}`);
    } else {
      // Add to store - HAE SISÄLTÖ ENNEN LISÄYSTÄ
      setLoadingAllDocs(true); // Näytä latausindikaattori
      try {
        const content = await assessmentService.getDocumentContent(document.id);
        if (!content) {
          throw new Error("Dokumentin sisällön haku epäonnistui.");
        }
        updatedSelectedDocs = [...selectedDocsInStore, content];
        console.log(`[InitialSelectionStep] Document added. New selected count: ${updatedSelectedDocs.length}`);
      } catch (err) {
        console.error("Error fetching content for selection:", err);
        toast({ title: "Virhe", description: "Dokumentin sisällön haku epäonnistui valittaessa.", variant: "destructive"});
        setLoadingAllDocs(false);
        return; // Älä päivitä storea jos sisällön haku epäonnistuu
      } finally {
        setLoadingAllDocs(false);
      }
    }
    updateSelectedDocsInStore(updatedSelectedDocs);
  }, [selectedDocsInStore, updateSelectedDocsInStore, isDocumentSelected, toast]);

  // Handle file upload through the store
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !companyId) {
      console.log("Tiedostoja ei valittu tai companyId puuttuu:", { 
        filesExist: !!files, 
        filesLength: files?.length, 
        companyId 
      });

      // Näytä toast virheestä jos companyId puuttuu
      if (!companyId) {
        toast({
          title: "Virhe tiedostojen käsittelyssä",
          description: "Yritystä ei ole valittu. Valitse yritys ennen tiedostojen latausta.",
          variant: "destructive"
        });
      }

      return;
    }

    setUploadingNewDoc(true);
    try {
      console.log("Aloitetaan tiedostojen lataus:", files.length, "tiedostoa");
      console.log("Tiedostotyypit:", Array.from(files).map(f => f.type).join(", "));

      // Käytä storen funktiota
      await uploadDocumentsToStore(files, companyId);

      toast({
        title: "Tiedostot lisätty",
        description: `${files.length} tiedostoa valmiina analyysiin.`
      });

      // Päivitä KAIKKIEN dokumenttien lista, jotta uusi näkyy heti
      await fetchAllCompanyDocuments();

      // Sulje latausosio onnistumisen jälkeen
      setIsFileUploadVisible(false);
    } catch (error: any) {
      console.error("Virhe tiedostojen käsittelyssä:", error);
      setLocalError(`Tiedostojen käsittelyssä tapahtui virhe: ${error.message || 'Tuntematon virhe'}`);
      toast({
        title: "Virhe tiedostojen käsittelyssä",
        description: error.message || "Tiedostojen käsittely epäonnistui",
        variant: "destructive"
      });
    } finally {
      setUploadingNewDoc(false);
    }
  };

  // Start assessment process - uses the store's startAssessment
  const handleStart = () => {
    setLocalError("");

    if (!companyId) {
      const msg = "Yritys pitää olla valittuna ennen arvioinnin aloittamista.";
      setLocalError(msg);
      toast({ title: "Virhe", description: msg, variant: "destructive" });
      return;
    }

    if (selectedDocsInStore.filter((d) => !d.error).length === 0) {
      const msg = "Valitse tai lataa vähintään yksi kelvollinen dokumentti arviointia varten.";
      setLocalError(msg);
      toast({ title: "Virhe", description: msg, variant: "destructive" });
      return;
    }

    console.log("[InitialSelectionStep] Starting assessment with selected documents:", selectedDocsInStore.map(d => d.name));
    startAssessment(); // Tämä kutsuu storen omaa startAssessment-funktiota
  };

  // Yhdistetty lataustila
  const isLoadingData = loadingAllDocs || storeIsLoading;
  // Yhdistetty virhetila
  const combinedError = localError || storeDocumentsError || storeSessionError;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">
          Aloita myyntikuntoisuusarviointi
        </h2>
        <p className="text-gray-600">
          Valitse arvioinnissa käytettävät dokumentit yritykselle: <strong>{activeCompany?.name || "Valitse yritys"}</strong>
        </p>
        {valuationId && (
           <Badge variant="secondary" className="mt-2">Aloitettu arvonmäärityksen pohjalta</Badge>
        )}
      </div>

      {/* Error Display */}
      {combinedError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Virhe</AlertTitle>
          <AlertDescription>{combinedError}</AlertDescription>
        </Alert>
      )}

      {/* Loading Indicator */}
      {isLoadingData && (
        <div className="flex justify-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Ladataan dokumentteja...</span>
        </div>
      )}

      {/* Document Selection Area */}
      {!isLoadingData && companyId && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Selected Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <CheckSquare className="h-5 w-5 text-green-600"/>
                 Valitut dokumentit analyysiin
              </CardTitle>
              <CardDescription>
                Nämä {selectedDocsInStore.length} dokumenttia käytetään arvioinnissa. Voit poistaa valinnan klikkaamalla.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {selectedDocsInStore.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Ei valittuja dokumentteja. Valitse alta tai lataa uusi.
                </p>
              ) : (
                selectedDocsInStore.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-md bg-indigo-50 border-indigo-200 cursor-pointer hover:bg-indigo-100"
                    onClick={() => toggleDocumentSelection(doc)}
                    title={`Poista valinta: ${doc.name}`}
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <FileText className="h-4 w-4 flex-shrink-0 text-indigo-600" />
                      <div className="flex-grow overflow-hidden">
                        <span className="text-sm font-medium truncate block text-indigo-800">
                          {doc.name}
                        </span>
                        {doc.error && (
                          <span className="text-xs text-red-600 block truncate" title={doc.error}>
                            Virhe: {doc.error}
                          </span>
                        )}
                      </div>
                      {!doc.error && (
                        <Badge variant="secondary" className="text-xs bg-white text-indigo-700 border-indigo-200">
                          Valittu
                        </Badge>
                      )}
                    </div>
                    <X className="h-4 w-4 text-slate-500 hover:text-red-600 flex-shrink-0 ml-2" />
                  </div>
                ))
              )}
            </CardContent>
             {selectedDocsInStore.filter((d) => d.error).length > 0 && (
              <CardFooter className="text-xs text-red-600 pt-2">
                Virheellisiä dokumentteja ei käytetä analyysissä.
              </CardFooter>
            )}
          </Card>

          {/* Right: Available Documents & Upload */}
          <div className="space-y-6">
            {/* Available Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Saatavilla olevat dokumentit</CardTitle>
                <CardDescription>Valitse muita tallennettuja dokumentteja klikkaamalla.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {allCompanyDocuments.length === 0 && !loadingAllDocs ? (
                   <p className="text-sm text-gray-500 text-center py-4">
                     Ei muita tallennettuja dokumentteja tälle yritykselle.
                   </p>
                ) : (
                  allCompanyDocuments
                    .filter(doc => !isDocumentSelected(doc.id)) // Näytä vain ne, joita ei ole valittu
                    .map((doc) => (
                      <Button
                        key={doc.id}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => toggleDocumentSelection(doc)}
                        disabled={isLoadingData} // Käytetään yhdistettyä lataustilaa
                        title={`Valitse: ${doc.name}`}
                      >
                        <FileText className="mr-2 h-4 w-4 flex-shrink-0 text-slate-500" />
                        <div className="flex-grow overflow-hidden">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-slate-500">
                            Tyyppi: {assessmentService.inferDocumentType(doc.name)} | Lisätty: {formatDate(doc.created_at)}
                          </p>
                        </div>
                        <Check className="ml-auto h-4 w-4 text-transparent group-hover:text-green-500" />
                      </Button>
                    ))
                )}
              </CardContent>
            </Card>

            {/* Upload New Document Section */}
            <Card>
              {/* Ohjeistuslaatikko */}
              <CardContent className="pt-4">
                <div className="mb-3 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
                  <p className="font-medium mb-1">Mitä dokumentteja voit ladata arvioinnin tueksi?</p>
                  <p className="mb-2">Lisädokumenttien lataaminen on vapaaehtoista, mutta auttaa tarkemman arvioinnin tekemisessä.</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Liiketoimintasuunnitelma (strategia, toiminnan kuvaus)</li>
                    <li>Myyntiesitteet ja -materiaalit (yrityksen esittelymateriaali)</li>
                    <li>Organisaatiokaaviot ja vastuukuvaukset</li>
                    <li>Prosessikuvaukset ja toimintaohjeet</li>
                  </ul>
                </div>
              </CardContent>

              {/* Tiedoston latausosio */}
              <CardHeader 
                className="flex flex-row items-center justify-between cursor-pointer hover:bg-slate-50"
                onClick={() => setIsFileUploadVisible(!isFileUploadVisible)}
              >
                <div className="flex items-center">
                  <FileUp className="h-5 w-5 mr-2 text-indigo-600"/>
                  <CardTitle>Lataa uusi tiedosto</CardTitle>
                </div>
                {isFileUploadVisible ? <X className="h-4 w-4 text-slate-500"/> : <PlusCircle className="h-4 w-4 text-slate-500"/>}
              </CardHeader>

              {isFileUploadVisible && (
                <CardContent className="pt-0">
                  <FileUpload
                    onFilesSelected={handleFileUpload}
                    isLoading={uploadingNewDoc}
                    multiple={true} // Salli usean tiedoston lataus kerralla
                    maxFileSize={15}
                    acceptedFileTypes=".pdf,.csv,.txt,.md,.json,.xml,.html"
                    instructionText="Lisää dokumentteja, jotka auttavat yrityksen myyntikuntoisuuden arvioinnissa"
                    buttonText="Selaa tiedostoja"
                  />
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Start button */}
      {companyId && !uploadingNewDoc && (
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Analysointi kestää noin 1-2 minuuttia dokumenttien määrästä ja koosta riippuen.
          </p>
          <Button
            size="lg"
            onClick={handleStart}
            disabled={isLoadingData || uploadingNewDoc || selectedDocsInStore.filter((d) => !d.error).length === 0}
            className="w-full max-w-md rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
          >
            {storeIsLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aloitetaan arviointia...
              </>
            ) : (
              "Aloita myyntikuntoisuusarviointi"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

// Apufunktio päivämäärän muotoiluun
const formatDate = (dateString?: string): string => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("fi-FI");
  } catch (e) {
    return "-";
  }
};

// Apufunktio UUID:n validointiin
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export default InitialSelectionStep;