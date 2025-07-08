import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, X, Upload, AlertCircle, HelpCircle, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Company } from "@/components/assessment/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Document form schema
const documentFormSchema = z.object({
  document_type: z.string().min(1, { message: "Dokumentin tyyppi on pakollinen" }),
  description: z.string().optional(),
  file: z.instanceof(File, { message: "Tiedosto on pakollinen" }).optional(),
});

type DocumentFormData = z.infer<typeof documentFormSchema>;

// Document type
interface Document {
  id: string;
  name: string;
  document_type: string;
  description: string | null;
  file_path: string | null;
  created_at: string;
}

// Document type options
const documentTypeOptions = [
  { value: "tilinpaatos", label: "Tilinpäätös" },
  { value: "tase-erittely", label: "Tase-erittely" },
  { value: "tilinpaatos-liite", label: "Tilinpäätökseen liittyvä liite" },
  { value: "muu", label: "Muu dokumentti" }
];

interface DocumentsTabProps {
  user: any;
  isNewUser: boolean;
  selectedCompany: Company | null;
  onComplete?: () => void;
}

const DocumentsTab = ({ user, isNewUser, selectedCompany, onComplete }: DocumentsTabProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showSuccessPrompt, setShowSuccessPrompt] = useState(false);

  const documentForm = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      document_type: "",
      description: "",
      file: undefined,
    },
  });

  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyDocuments(selectedCompany.id);
    }
  }, [selectedCompany]);

  const fetchCompanyDocuments = async (companyId: string) => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from('company_documents')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching company documents:', error);
      toast({
        title: "Virhe",
        description: "Dokumenttien lataaminen epäonnistui",
        variant: "destructive",
      });
    }
  };

  const onDocumentSubmit = async (data: DocumentFormData) => {
    if (!user || !selectedCompany || !data.file) return;

    setIsUploading(true);
    try {
      const fileExt = data.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${selectedCompany.id}/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('company-files')
        .upload(filePath, data.file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('company_documents')
        .insert({
          company_id: selectedCompany.id,
          name: data.file.name,
          file_path: filePath,
          document_type: data.document_type,
          description: data.description || null,
          is_public: false,
          is_processed: false,
          file_type: fileExt,
        });

      if (dbError) throw dbError;

      toast({
        title: "Dokumentti ladattu",
        description: "Dokumentti on tallennettu onnistuneesti. Voit nyt lisätä seuraavan dokumentin.",
      });

      // Tyhjennetään lomake kokonaan uuden dokumentin lisäämistä varten
      documentForm.reset({
        document_type: "",
        description: "",
        file: undefined
      });
      
      // Tyhjennetään tiedostokenttä kokonaan
      setSelectedFile(null);
      
      // Varmistetaan että HTML input-elementti tyhjentyy myös
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Päivitetään dokumenttilista
      fetchCompanyDocuments(selectedCompany.id);

      // Näytetään onnistumisviesti lomakkeessa
      setShowSuccessPrompt(true);
      
      // Piilotetaan onnistumisviesti 5 sekunnin jälkeen
      setTimeout(() => {
        setShowSuccessPrompt(false);
      }, 5000);

      // POISTETTU: Ei siirrytä automaattisesti eteenpäin dokumentin lisäämisen jälkeen
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Virhe",
        description: error.message || "Dokumentin tallentaminen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      documentForm.setValue('file', file);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!documentId || !selectedCompany) return;

    try {
      const { data: document, error: fetchError } = await supabase
        .from('company_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      if (document?.file_path) {
        const { error: storageError } = await supabase
          .storage
          .from('company-files')
          .remove([document.file_path]);

        if (storageError) console.error('Error removing file:', storageError);
      }

      const { error: deleteError } = await supabase
        .from('company_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;

      toast({
        title: "Dokumentti poistettu",
        description: "Dokumentti on poistettu onnistuneesti",
      });

      fetchCompanyDocuments(selectedCompany.id);
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Virhe",
        description: error.message || "Dokumentin poistaminen epäonnistui",
        variant: "destructive",
      });
    }
  };

  const getDocumentTypeInstructions = () => {
    const companyType = selectedCompany?.company_type;

    if (companyType === 'osakeyhtiö') {
      return "Valitse ensin dokumentin tyyppi, klikkaa sitten 'Choose file', valitse haluamasi tiedosto ja klikkaa lopuksi 'Lataa dokumentti'. Toista sama seuraaville dokumenteille. Osakeyhtiön kohdalla tarvitaan minimissään viimeisin tilinpäätös (PDF, TXT, CSV -muodossa)";
    } else if (companyType === 'henkilöyhtiö') {
      return "Valitse ensin dokumentin tyyppi, klikkaa sitten 'Choose file', valitse haluamasi tiedosto ja klikkaa lopuksi 'Lataa dokumentti'. Toista sama seuraaville dokumenteille. Henkilöyhtiön kohdalla tarvitaan esimerkiksi seuraavia dokumentteja: suppea tilinpäätös, tase-erittely, tuloslaskenta tai vastaavia dokumentteja (PDF, TXT, CSV -muodossa)";
    } else {
      return "Valitse ensin dokumentin tyyppi, klikkaa sitten 'Choose file', valitse haluamasi tiedosto ja klikkaa lopuksi 'Lataa dokumentti'. Toista sama seuraaville dokumenteille. Lataa yrityksesi tilinpäätöstiedot ja muut tarvittavat dokumentit (PDF, TXT, CSV -muodossa)";
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <FileText className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-2xl">Dokumentit</CardTitle>
            <CardDescription>
              {isNewUser 
                ? "Lisää yrityksesi dokumentit arvonmääritystä varten" 
                : "Hallinnoi yrityksesi dokumentteja"
              }
            </CardDescription>
          </div>
        </div>

        {isNewUser && (
          <div className="mt-4 bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium mb-1">Dokumenttien lisääminen</h3>
            <p className="text-sm">
              Lataa yrityksen tilinpäätösdokumentit arvonmääritystä varten. Voit ladata useita dokumentteja.
            </p>
            <ol className="text-sm mt-2 list-decimal list-inside">
              <li>Henkilötiedot ja Y-tunnus ✓</li>
              <li>Yrityksen perustiedot ✓</li>
              <li className="font-medium">Dokumenttien lataus (tämä vaihe)</li>
            </ol>
            <p className="text-sm mt-2">
              Kun olet ladannut kaikki tarvittavat dokumentit, paina "Siirry arvonmääritykseen" -nappia jatkaaksesi.
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {!selectedCompany ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Valitse ensin yritys, jonka dokumentteja haluat hallita</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert className="bg-blue-50 text-blue-800 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle>Ohje</AlertTitle>
              <AlertDescription>{getDocumentTypeInstructions()}</AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 gap-6">
              {!showManualEntry ? (
                <Form {...documentForm}>
                  <form onSubmit={documentForm.handleSubmit(onDocumentSubmit)} className="space-y-4">
                    <FormField
                      control={documentForm.control}
                      name="document_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dokumentin tyyppi</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Valitse dokumentin tyyppi" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {documentTypeOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {documentForm.watch('document_type') === 'muu' && (
                      <FormField
                        control={documentForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kuvaus</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Kerro mikä dokumentti on kyseessä" 
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={documentForm.control}
                      name="file"
                      render={() => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Tiedosto</FormLabel>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <span className="sr-only">Info</span>
                                    <HelpCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="max-w-xs p-2">
                                    <p className="font-medium">Tuetut tiedostomuodot:</p>
                                    <p className="mt-1">PDF (.pdf), Tekstitiedostot (.txt, .md), Data (.csv, .json, .xml), HTML (.html)</p>
                                    <p className="mt-2 font-medium">Maksimikoko:</p>
                                    <p className="mt-1">10 MB</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                onChange={handleFileChange}
                                className="flex-1"
                                accept=".pdf,.txt,.csv"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                          {showSuccessPrompt && (
                            <div className="mt-2 bg-green-50 border border-green-200 text-green-700 p-2 rounded-md flex items-center">
                              <Check className="h-4 w-4 mr-2" />
                              <span className="text-sm">Edellinen dokumentti lisätty onnistuneesti! Voit nyt lisätä seuraavan.</span>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between items-center pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowManualEntry(true)}
                      >
                        Ei dokumentteja
                      </Button>

                      <Button 
                        type="submit" 
                        disabled={isUploading || !selectedFile}
                        className="min-w-32 text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Ladataan...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Lataa dokumentti
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle>Ei dokumentteja saatavilla</AlertTitle>
                    <AlertDescription>
                      Voit syöttää tilinpäätöstiedot manuaalisesti tähän lomakkeeseen.
                      (Tämä toiminto on tulossa myöhemmässä vaiheessa)
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowManualEntry(false)}
                    >
                      Takaisin dokumenttien lataukseen
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8">
              {documents.length > 0 ? (
                <>
                  <h3 className="text-lg font-medium mb-4">Ladatut dokumentit</h3>
                  <div className="space-y-3">
                    {documents.map(doc => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-slate-600" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-slate-500">
                              {documentTypeOptions.find(opt => opt.value === doc.document_type)?.label || doc.document_type}
                              {doc.description && ` - ${doc.description}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <X className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                isNewUser && (
                  <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed">
                    <FileText className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-slate-700">Ei dokumentteja</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Dokumenttien lataaminen parantaa arvonmäärityksen tarkkuutta, 
                      mutta voit myös jatkaa ilman dokumentteja
                    </p>
                  </div>
                )
              )}

              {/* Siirtymisnappi näytetään aina kun onComplete callback on määritelty */}
              {onComplete && (
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={onComplete}
                    className="text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Siirry arvonmääritykseen
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentsTab;