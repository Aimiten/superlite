import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/use-company";
import { Loader2, Building, HelpCircle } from "lucide-react";
import { Company, CompanyType, OwnershipChangeType } from "@/components/assessment/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { fetchYTJData } from "@/utils/ytj-service";

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

interface CompanyTabProps {
  user: any;
  isNewUser: boolean;
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  onContinue?: () => void;
  businessId?: string; // Mahdollinen Y-tunnus edellisestä vaiheesta
}

const CompanyTab = ({ 
  user, 
  isNewUser, 
  companies, 
  selectedCompany, 
  setSelectedCompany,
  onContinue,
  businessId 
}: CompanyTabProps) => {
  const { toast } = useToast();
  const { refetch } = useCompany();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtherField, setShowOtherField] = useState(false);
  const [ytjDataFetched, setYtjDataFetched] = useState(false);

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: selectedCompany?.name || "",
      business_id: selectedCompany?.business_id || businessId || "",
      industry: selectedCompany?.industry || "",
      founded: selectedCompany?.founded || "",
      employees: selectedCompany?.employees || "",
      company_type: selectedCompany?.company_type,
      ownership_change_type: selectedCompany?.ownership_change_type,
      ownership_change_other: selectedCompany?.ownership_change_other || "",
      website: selectedCompany?.website || "",
      is_public: selectedCompany?.is_public || false,
    },
  });

  useEffect(() => {
    const fetchYTJDataIfNeeded = async () => {
      const currentBusinessId = companyForm.getValues("business_id");
      if (businessId && businessId === currentBusinessId && !ytjDataFetched && isNewUser) {
        await fetchAndPopulateYTJData(businessId);
      }
    };

    fetchYTJDataIfNeeded();
  }, [businessId, ytjDataFetched, isNewUser]);

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
    }
  }, [selectedCompany]);

  const fetchAndPopulateYTJData = async (businessId: string) => {
    if (!businessId) return;

    setIsLoading(true);
    try {
      const ytjData = await fetchYTJData(businessId);

      companyForm.setValue("name", ytjData.name);
      companyForm.setValue("business_id", ytjData.business_id);
      companyForm.setValue("industry", ytjData.industry_name || "");
      companyForm.setValue("founded", ytjData.registration_date?.split('T')[0] || "");
      if (ytjData.company_form?.toLowerCase().includes("osakeyhtiö")) {
        companyForm.setValue("company_type", "osakeyhtiö");
      } else if (ytjData.company_form?.toLowerCase().includes("toiminimi")) {
        companyForm.setValue("company_type", "toiminimi");
      } else if (ytjData.company_form?.toLowerCase().includes("kommandiittiyhtiö") || 
                ytjData.company_form?.toLowerCase().includes("avoin yhtiö")) {
        companyForm.setValue("company_type", "henkilöyhtiö");
      } else {
        companyForm.setValue("company_type", "muu");
      }
      companyForm.setValue("website", ytjData.website || "");

      setYtjDataFetched(true);
      toast({
        title: "Yritystiedot haettu",
        description: "Tarkista tiedot ja täydennä puuttuvat kentät",
      });
    } catch (error: any) {
      console.error('Error fetching YTJ data:', error);
      toast({
        title: "Virhe",
        description: error.message || "Yritystietojen haku epäonnistui",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

        // Tietokannasta päivitetyt tiedot
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

          const updated = typedData.find(c => c.id === selectedCompany.id);
          if (updated) {
            setSelectedCompany(updated);
          }
        }

        // Jos kyseessä on uusi käyttäjä, jatketaan eteenpäin
        if (isNewUser && onContinue) {
          onContinue();
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

        // Päivitetään tila
        const typedNewCompany = {
          ...newCompany,
          company_type: newCompany.company_type as CompanyType | null,
          ownership_change_type: newCompany.ownership_change_type as OwnershipChangeType | null
        };
        setSelectedCompany(typedNewCompany);

        // FAANG-ratkaisu: Päivitä globaali context heti
        console.log("🔄 CompanyTab: Kutsutaan refetch() uuden yrityksen luomisen jälkeen");
        refetch();

        // Jos kyseessä on uusi käyttäjä, jatketaan eteenpäin
        if (isNewUser && onContinue) {
          onContinue();
        }
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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Yritys</CardTitle>
              <CardDescription>
                {isNewUser 
                  ? "Tarkista ja täydennä yrityksen tiedot" 
                  : "Hallinnoi yrityksesi tietoja"
                }
              </CardDescription>
            </div>
          </div>

          {/* Uusi yritys -painike on poistettu */}
        </div>

        {isNewUser && (
          <div className="mt-4 bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium mb-1">Yritystiedot</h3>
            <p className="text-sm">
              Olemme hakeneet yrityksen perustiedot YTJ-palvelusta Y-tunnuksen perusteella.
            </p>
            <ol className="text-sm mt-2 list-decimal list-inside">
              <li>Henkilötiedot ja Y-tunnus ✓</li>
              <li className="font-medium">Yrityksen perustiedot (tämä vaihe)</li>
              <li>Dokumenttien lataus</li>
            </ol>
            <p className="text-sm mt-2 font-medium text-blue-900">
              Tarkista esitäytetyt tiedot ja valitse "Omistajanvaihdoksen tyyppi", joka on oleellinen arvonmäärityksen kannalta.
            </p>
          </div>
        )}

        {!isNewUser && companies.length > 1 && (
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
            <span className="ml-2">Haetaan yritystietoja YTJ:stä...</span>
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
                      <FormLabel>Perustamispäivämäärä</FormLabel>
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
                              type="button"
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
                  className="min-w-32 text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Tallennetaan...
                    </>
                  ) : isNewUser ? "Jatka dokumentteihin" : "Tallenna muutokset"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyTab;