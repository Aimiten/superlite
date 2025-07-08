import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import { supabase } from "@/integrations/supabase/client";
import { User, Building, FileText, CalendarDays } from "lucide-react";
import ActivityTab from "@/components/profile/ActivityTab";
import ProfileTab from "@/components/profile/ProfileTab";
import CompanyTab from "@/components/profile/CompanyTab";
import DocumentsTab from "@/components/profile/DocumentsTab";
import { Company } from "@/components/assessment/types";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { companies, activeCompany, refetch, loading: companiesLoading } = useCompany();

  // Tarkista onko URL-parametrissa tab-parametri
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || "profile");

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [profileData, setProfileData] = useState<{full_name?: string, business_id?: string}>({});
  const [businessId, setBusinessId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        // Haetaan profiilitiedot
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, company_name, email')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profileData) {
          setProfileData({
            full_name: profileData.full_name || "",
            business_id: ""
          });
        }

      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Virhe",
          description: "Tietojen lataaminen epäonnistui",
          variant: "destructive",
        });
      }
    };

    fetchUserData();
  }, [user, toast]);

  // Käytä useCompany hookin tietoja
  useEffect(() => {
    if (!companiesLoading) {
      if (companies.length > 0) {
        setIsNewUser(false);
        setSelectedCompany(activeCompany);
      } else {
        setIsNewUser(true);
      }
    }
  }, [companies, activeCompany, companiesLoading]);

  // Käsittelijät välilehtien välillä siirtymiseen
  const handleProfileContinue = (businessId: string) => {
    setBusinessId(businessId);
    setActiveTab("companies");
  };

  const handleCompanyContinue = () => {
    setActiveTab("documents");
  };

  const handleDocumentsComplete = () => {
    // Suora navigointi - Valuation-sivu hoitaa oman validoinnin
    toast({
      title: "Profiili valmis!",
      description: "Siirrytään arvonmääritykseen.",
    });

    // Välitön navigointi ilman viivettä - tuotantoluokan UX
    navigate("/valuation", { replace: true });
  };

  return (
    <DashboardLayout 
      showBackButton
    >
      <div className="max-w-3xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Käyttäjäprofiili</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Yritys</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Dokumentit</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>Aktiviteetit</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab 
              user={user} 
              isNewUser={isNewUser} 
              onContinue={handleProfileContinue}
              initialData={profileData}
            />
          </TabsContent>

          <TabsContent value="companies">
            <CompanyTab 
              user={user}
              isNewUser={isNewUser}
              companies={companies}
              selectedCompany={selectedCompany}
              setSelectedCompany={setSelectedCompany}
              onContinue={handleCompanyContinue}
              businessId={businessId}
            />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab 
              user={user}
              isNewUser={isNewUser}
              selectedCompany={selectedCompany}
              onComplete={handleDocumentsComplete}
            />
          </TabsContent>

          <TabsContent value="activities">
            <ActivityTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;