import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, AlertTriangle, Trash2 } from "lucide-react";
import { fetchYTJData, isValidBusinessId } from "@/utils/ytj-service";
import ResetDataDialog from "./ResetDataDialog";

// Profile form schema
const profileFormSchema = z.object({
  full_name: z.string().min(2, { message: "Nimi on pakollinen" }),
  business_id: z.string().optional()
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileTabProps {
  user: any;
  isNewUser: boolean;
  onContinue?: (businessId: string) => void;
  initialData?: {
    full_name?: string;
    business_id?: string;
  };
}

const ProfileTab = ({ user, isNewUser, onContinue, initialData }: ProfileTabProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: initialData?.full_name || "",
      business_id: initialData?.business_id || ""
    },
  });

  // Päivitä lomakkeen arvot kun initialData muuttuu
  useEffect(() => {
    if (initialData && initialData.full_name) {
      profileForm.reset({
        full_name: initialData.full_name,
        business_id: initialData.business_id || ""
      });
    }
  }, [initialData, profileForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Jos Y-tunnus on annettu ja kyseessä on uusi käyttäjä, haetaan yrityksen tiedot
      if (data.business_id && isNewUser) {
        await handleBusinessIdCheck(data.business_id);
      } else {
        toast({
          title: "Profiili päivitetty",
          description: "Profiilitietosi on päivitetty onnistuneesti",
        });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Virhe",
        description: error.message || "Profiilin päivitys epäonnistui",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBusinessIdCheck = async (businessId: string) => {
    if (!businessId) return;

    // Validoidaan Y-tunnus
    if (!isValidBusinessId(businessId)) {
      toast({
        title: "Virheellinen Y-tunnus",
        description: "Tarkista Y-tunnus ja yritä uudelleen",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    try {
      // Haetaan yritystiedot YTJ-palvelusta
      await fetchYTJData(businessId);

      toast({
        title: "Yritystiedot haettu",
        description: "Yrityksen tiedot haettu onnistuneesti",
      });

      // Jatketaan seuraavaan vaiheeseen
      if (onContinue) {
        onContinue(businessId);
      }
    } catch (error: any) {
      console.error('Error fetching YTJ data:', error);
      toast({
        title: "Virhe",
        description: error.message || "Yritystietojen haku epäonnistui",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Käyttäjäprofiili</CardTitle>
            <CardDescription>
              {isNewUser 
                ? "Aloitetaan kertomalla kuka olet ja minkä yrityksen tietoja haluat käsitellä" 
                : "Päivitä tietojasi."
              }
            </CardDescription>
          </div>
        </div>

        {isNewUser && (
          <div className="mt-4 bg-info/10 text-info-foreground p-4 rounded-lg border border-info/20">
            <h3 className="font-medium mb-1">Tervetuloa arvonmääritykseen!</h3>
            <p className="text-base">
              Käymme läpi kolme vaihetta yrityksen arvonmäärityksen käynnistämiseksi:
            </p>
            <ol className="text-base mt-2 list-decimal list-inside">
              <li className="font-medium">Henkilötiedot ja Y-tunnus (tämä vaihe)</li>
              <li>Yrityksen perustiedot</li>
              <li>Dokumenttien lataus</li>
            </ol>
            <p className="text-base mt-2">
              Aloita antamalla nimesi ja yrityksen Y-tunnus. Haemme automaattisesti yrityksen perustiedot Y-tunnuksen perusteella.
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent>
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

            {isNewUser && (
              <FormField
                control={profileForm.control}
                name="business_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yrityksen Y-tunnus</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Syötä yrityksen Y-tunnus (esim. 1234567-8)" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <CardFooter className="px-0 pt-6 flex justify-between">
              {!isNewUser && (
                <ResetDataDialog disabled={isSaving || isChecking} />
              )}
              <div className="flex-1 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving || isChecking}
                  className="min-w-32 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {(isSaving || isChecking) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isChecking ? "Tarkistetaan..." : "Tallennetaan..."}
                    </>
                  ) : isNewUser ? "Jatka yritystietoihin" : "Tallenna muutokset"}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileTab;