import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Building, Share2, HelpCircle, FileText, Plus, X, Upload, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Company, CompanyType, OwnershipChangeType } from "@/components/assessment/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Profile form schema
const profileFormSchema = z.object({
  full_name: z.string().min(2, { message: "Nimi on pakollinen" }),
  company_name: z.string().optional(),
  email: z.string().email({ message: "Sähköpostiosoite ei ole kelvollinen" }).optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

// Company form schema
const companyFormSchema = z.object({
  name: z.string().min(2, { message: "Yrityksen nimi on pakollinen" }),
  business_id: z.string().optional(),
  industry: z.string().optional(),
  founded: z.string().optional(),
  employees: z.string().optional(),
  company_type: z.enum(["osakeyhtiö", "henkilöyhtiö", "toiminimi", "muu"]).optional(),
  ownership_change_type: z.enum(["osakekauppa", "liiketoimintakauppa", "toiminimikauppa", "sukupolvenvaihdos", "henkilöstökauppa", "laajentaminen", "muu"]).optional(),
  ownership_change_other: z.string().optional(),
  website: z.string().optional(),
  is_public: z.boolean().default(false),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

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

// Omistajuuden muutostyyppien kuvaukset
const ownershipTypeDescriptions: Record<string, string> = {
  osakekauppa: "Yrityksen osakkeiden tai osuuksien myynti ulkopuoliselle ostajalle",
  liiketoimintakauppa: "Pelkän liiketoiminnan ja siihen liittyvän omaisuuden myynti",
  toiminimikauppa: "Toiminimen liiketoiminnan ja omaisuuden siirto",
  sukupolvenvaihdos: "Yrityksen siirtäminen perheenjäsenelle tai jälkipolville",
  henkilöstökauppa: "Yrityksen myynti sen työntekijöille tai johdolle",
  laajentaminen: "Uusien osakkaiden ottaminen mukaan yritykseen",
  muu: "Muu omistajanvaihdos"
};

// Document type options
const documentTypeOptions = [
  { value: "tilinpaatos", label: "Tilinpäätös" },
  { value: "tase-erittely", label: "Tase-erittely" },
  { value: "tilinpaatos-liite", label: "Tilinpäätökseen liittyvä liite" },
  { value: "muu", label: "Muu dokumentti" }
];

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showOtherField, setShowOtherField] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: "",
      company_name: "",
      email: user?.email || "",
    },
  });

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      business_id: "",
      industry: "",
      founded: "",
      employees: "",
      company_type: undefined,
      ownership_change_type: undefined,
      ownership_change_other: "",
      website: "",
      is_public: false,
    },
  });

  const documentForm = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      document_type: "",
      description: "",
      file: undefined,
    },
  });

  useEffect(() => {
    const ownershipType = companyForm.watch("ownership_change_type");
    setShowOtherField(ownershipType === "muu");
  }, [companyForm.watch("ownership_change_type")]);

  useEffect(() => {
    if (selectedCompany) {
      companyForm.reset({
        name: selectedCompany.name,
        business_id: selectedCompany.business_id || "",
        industry: selectedCompany.industry || "",
        founded: selectedCompany.founded || "",
        employees: selectedCompany.employees || "",
        company_type: selectedCompany.company_type,
        ownership_change_type: selectedCompany.ownership_change_type,
        ownership_change_other: selectedCompany.ownership_change_other || "",
        website: selectedCompany.website || "",
        is_public: selectedCompany.is_public,
      });

      fetchCompanyDocuments(selectedCompany.id);
    }
  }, [selectedCompany]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, company_name, email')
          .eq('id', user.id)
          .maybeSingle();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          profileForm.reset({
            full_name: data.full_name || "",
            company_name: data.company_name || "",
            email: data.email || user.email || "",
          });
        }

        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (companiesError) {
          throw companiesError;
        }
        
        if (companiesData && companiesData.length > 0) {
          const typedData = companiesData.map(item => ({
            ...item,
            company_type: item.company_type as CompanyType | null,
            ownership_change_type: item.ownership_change_type as OwnershipChangeType | null
          }));
          
          setCompanies(typedData);
          setSelectedCompany(typedData[0]);
        }

      } catch (error) {
        console.error('Error fetching profile or companies:', error);
        toast({
          title: "Virhe",
          description: "Tietojen lataaminen epäonnistui",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, profileForm, toast]);

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

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          company_name: data.company_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Profiili päivitetty",
        description: "Profiilitietosi on päivitetty onnistuneesti",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Virhe",
        description: "Profiilin päivitys epäonnistui",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onCompanySubmit = async (data: CompanyFormData) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      if (selectedCompany) {
        const { error } = await supabase
          .from('companies')
          .update({
            name: data.name,
            business_id: data.business_id,
            industry: data.industry,
            founded: data.founded,
            employees: data.employees,
            company_type: data.company_type,
            ownership_change_type: data.ownership_change_type,
            ownership_change_other: data.ownership_change_type === "muu" ? data.ownership_change_other : null,
            website: data.website,
            is_public: data.is_public,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedCompany.id);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: "Yritys päivitetty",
          description: "Yritystiedot on päivitetty onnistuneesti",
        });

        const { data: companiesData, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (fetchError) {
          throw fetchError;
        }
        
        if (companiesData) {
          const typedData = companiesData.map(item => ({
            ...item,
            company_type: item.company_type as CompanyType | null,
            ownership_change_type: item.ownership_change_type as OwnershipChangeType | null
          }));
          
          setCompanies(typedData);
          const updated = typedData.find(c => c.id === selectedCompany.id);
          if (updated) {
            setSelectedCompany(updated);
          }
        }

      } else {
        const { data: newCompany, error } = await supabase
          .from('companies')
          .insert({
            user_id: user.id,
            name: data.name,
            business_id: data.business_id,
            industry: data.industry,
            founded: data.founded,
            employees: data.employees,
            company_type: data.company_type,
            ownership_change_type: data.ownership_change_type,
            ownership_change_other: data.ownership_change_type === "muu" ? data.ownership_change_other : null,
            website: data.website,
            is_public: data.is_public,
          })
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        toast({
          title: "Yritys luotu",
          description: "Uusi yritys on luotu onnistuneesti",
        });

        const { data: companiesData, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (fetchError) {
          throw fetchError;
        }
        
        if (companiesData) {
          const typedData = companiesData.map(item => ({
            ...item,
            company_type: item.company_type as CompanyType | null,
            ownership_change_type: item.ownership_change_type as OwnershipChangeType | null
          }));
          
          setCompanies(typedData);
          const typedNewCompany = {
            ...newCompany,
            company_type: newCompany.company_type as CompanyType | null,
            ownership_change_type: newCompany.ownership_change_type as OwnershipChangeType | null
          };
          setSelectedCompany(typedNewCompany);
        }

        companyForm.reset({
          name: "",
          business_id: "",
          industry: "",
          founded: "",
          employees: "",
          company_type: undefined,
          ownership_change_type: undefined,
          ownership_change_other: "",
          website: "",
          is_public: false,
        });
      }
    } catch (error: any) {
      console.error('Error saving company:', error);
      toast({
        title: "Virhe",
        description: error.message || "Yritystietojen tallentaminen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onDocumentSubmit = async (data: DocumentFormData) => {
    if (!user || !selectedCompany || !data.file) return;
    
    setIsUploading(true);
    try {
      const fileExt = data.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `company_documents/${selectedCompany.id}/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('company_documents')
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
        description: "Dokumentti on tallennettu onnistuneesti",
      });

      documentForm.reset();
      setSelectedFile(null);
      fetchCompanyDocuments(selectedCompany.id);
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
          .from('company_documents')
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

  const handleCreateNewCompany = () => {
    setSelectedCompany(null);
    companyForm.reset({
      name: "",
      business_id: "",
      industry: "",
      founded: "",
      employees: "",
      company_type: undefined,
      ownership_change_type: undefined,
      ownership_change_other: "",
      website: "",
      is_public: false,
    });
  };

  const getDocumentTypeInstructions = () => {
    const companyType = selectedCompany?.company_type;
    
    if (companyType === 'osakeyhtiö') {
      return "Osakeyhtiön kohdalla tarvitaan minimissään viimeisin tilinpäätös";
    } else if (companyType === 'henkilöyhtiö') {
      return "Henkilöyhtiön kohdalla tarvitaan esimerkiksi seuraavia dokumentteja: suppea tilinpäätös, tase-erittely, tuloslaskenta tai vastaavia dokumentteja";
    } else {
      return "Lataa yrityksesi tilinpäätöstiedot ja muut tarvittavat dokumentit";
    }
  };

  return (
    <DashboardLayout 
      pageTitle="Profiili" 
      pageDescription="Hallitse käyttäjä- ja yritystietojasi"
      showBackButton
    >
      <div className="max-w-3xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Käyttäjäprofiili</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Yritykset</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Dokumentit</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Käyttäjäprofiili</CardTitle>
                    <CardDescription>Päivitä henkilö- ja yrityksesi tietoja</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                  </div>
                ) : (
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nimi</FormLabel>
                            <FormControl>
                              <Input placeholder="Syötä nimesi" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="company_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Yrityksen nimi</FormLabel>
                            <FormControl>
                              <Input placeholder="Syötä yrityksesi nimi" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sähköposti</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Sähköpostiosoitteesi" 
                                {...field} 
                                value={field.value || ""}
                                disabled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <CardFooter className="px-0 pt-6 flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={isSaving}
                          className="min-w-32"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Tallennetaan...
                            </>
                          ) : "Tallenna muutokset"}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="companies">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <Building className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Yritystiedot</CardTitle>
                      <CardDescription>Hallinnoi yrityksesi tietoja</CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {selectedCompany && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => alert('Jakamistoiminto tulossa pian!')}
                      >
                        <Share2 className="h-4 w-4" />
                        Jaa
                      </Button>
                    )}
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={handleCreateNewCompany}
                    >
                      Uusi yritys
                    </Button>
                  </div>
                </div>
                
                {companies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {companies.map(company => (
                      <Button
                        key={company.id}
                        variant={selectedCompany?.id === company.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCompany(company)}
                      >
                        {company.name}
                      </Button>
                    ))}
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <Form {...companyForm}>
                    <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-6">
                      <FormField
                        control={companyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Yrityksen nimi</FormLabel>
                            <FormControl>
                              <Input placeholder="Syötä yrityksen nimi" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={companyForm.control}
                          name="business_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Y-tunnus</FormLabel>
                              <FormControl>
                                <Input placeholder="Y-tunnus" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={companyForm.control}
                          name="industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Toimiala</FormLabel>
                              <FormControl>
                                <Input placeholder="Toimiala" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={companyForm.control}
                          name="founded"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Perustamisvuosi</FormLabel>
                              <FormControl>
                                <Input placeholder="Esim. 2015" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={companyForm.control}
                          name="employees"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Henkilöstömäärä</FormLabel>
                              <FormControl>
                                <Input placeholder="Esim. 10-50" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={companyForm.control}
                        name="company_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Yhtiömuoto</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Valitse yhtiömuoto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="osakeyhtiö">Osakeyhtiö</SelectItem>
                                <SelectItem value="henkilöyhtiö">Henkilöyhtiö</SelectItem>
                                <SelectItem value="toiminimi">Toiminimi</SelectItem>
                                <SelectItem value="muu">Muu</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="ownership_change_type"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormLabel>Omistajanvaihdoksen tyyppi</FormLabel>
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
                                    <p className="max-w-xs">
                                      Valitse omistajanvaihdoksen tyyppi, jota suunnittelet yrityksellesi.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setShowOtherField(value === "muu");
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Valitse omistajanvaihdoksen tyyppi" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="osakekauppa">
                                  <div className="flex flex-col">
                                    <span>Osakekauppa</span>
                                    <span className="text-xs text-muted-foreground">{ownershipTypeDescriptions.osakekauppa}</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="liiketoimintakauppa">
                                  <div className="flex flex-col">
                                    <span>Liiketoimintakauppa</span>
                                    <span className="text-xs text-muted-foreground">{ownershipTypeDescriptions.liiketoimintakauppa}</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="toiminimikauppa">
                                  <div className="flex flex-col">
                                    <span>Toiminimiyrityksen myynti</span>
                                    <span className="text-xs text-muted-foreground">{ownershipTypeDescriptions.toiminimikauppa}</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="sukupolvenvaihdos">
                                  <div className="flex flex-col">
                                    <span>Sukupolvenvaihdos</span>
                                    <span className="text-xs text-muted-foreground">{ownershipTypeDescriptions.sukupolvenvaihdos}</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="henkilöstökauppa">
                                  <div className="flex flex-col">
                                    <span>Henkilöstökauppa</span>
                                    <span className="text-xs text-muted-foreground">{ownershipTypeDescriptions.henkilöstökauppa}</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="laajentaminen">
                                  <div className="flex flex-col">
                                    <span>Omistuspohjan laajentaminen</span>
                                    <span className="text-xs text-muted-foreground">{ownershipTypeDescriptions.laajentaminen}</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="muu">
                                  <div className="flex flex-col">
                                    <span>Muu omistajanvaihdos</span>
                                    <span className="text-xs text-muted-foreground">Määrittele omistajanvaihdoksen tyyppi</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {showOtherField && (
                        <FormField
                          control={companyForm.control}
                          name="ownership_change_other"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Muu omistajanvaihdos, mikä?</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Kuvaile suunnittelemasi omistajanvaihdoksen tyyppi"
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
                        control={companyForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verkkosivu</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <CardFooter className="px-0 pt-6 flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={isSaving}
                          className="min-w-32"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Tallennetaan...
                            </>
                          ) : selectedCompany ? "Päivitä yritys" : "Luo yritys"}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Dokumentit</CardTitle>
                      <CardDescription>Hallinnoi yrityksesi dokumentteja</CardDescription>
                    </div>
                  </div>
                </div>
                
                {companies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {companies.map(company => (
                      <Button
                        key={company.id}
                        variant={selectedCompany?.id === company.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCompany(company)}
                      >
                        {company.name}
                      </Button>
                    ))}
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
                  </div>
                ) : !selectedCompany ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Valitse ensin yritys tai luo uusi, jonka dokumentteja haluat hallita</p>
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
                                  <FormLabel>Tiedosto</FormLabel>
                                  <FormControl>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="flex-1"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
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
                                className="min-w-32"
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
                    
                    {documents.length > 0 && (
                      <div className="mt-8">
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
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
