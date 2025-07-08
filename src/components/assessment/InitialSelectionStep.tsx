
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, FileBarChart, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DocumentSelectionStep from "@/components/assessment/DocumentSelectionStep";
import { Document } from "@/components/assessment/types";

interface InitialSelectionStepProps {
  companyName: string;
  setCompanyName: (name: string) => void;
  companyId: string | null;
  setCompanyId: (id: string | null) => void;
  selectedDocuments: Document[];
  onDocumentsSelected: (documents: Document[]) => void;
  handleStart: () => void;
  isLoading: boolean;
  error: string;
  preselectedCompany?: string | null;
  onReset?: () => void;
}

const InitialSelectionStep: React.FC<InitialSelectionStepProps> = ({
  companyName,
  setCompanyName,
  companyId,
  setCompanyId,
  selectedDocuments,
  onDocumentsSelected,
  handleStart,
  isLoading,
  error,
  preselectedCompany,
  onReset
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [previousCompanies, setPreviousCompanies] = useState<{name: string}[]>([]);
  const [showCompanySelector, setShowCompanySelector] = useState<boolean>(false);
  const [showNewCompanyInput, setShowNewCompanyInput] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>("");

  useEffect(() => {
    if (preselectedCompany) {
      setCompanyName(preselectedCompany);
      findOrCreateCompany(preselectedCompany);
    } else {
      fetchPreviousCompanies();
    }
  }, [preselectedCompany]);

  const fetchPreviousCompanies = async () => {
    try {
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('company_name')
        .order('created_at', { ascending: false });

      if (assessmentError) {
        throw assessmentError;
      }

      let valuationCompanies: { company_name: string }[] = [];
      let tableExists = true;
      
      try {
        const { data, error } = await supabase
          .from('valuations')
          .select('*')
          .limit(1);
          
        if (error) {
          console.log('Valuations table might not exist yet:', error);
          tableExists = false;
        }
      } catch (err) {
        console.log('Error checking valuations table:', err);
        tableExists = false;
      }
      
      if (tableExists) {
        const { data: valuationData, error: valuationError } = await supabase
          .from('valuations')
          .select('company_name')
          .order('created_at', { ascending: false });

        if (!valuationError) {
          valuationCompanies = valuationData || [];
        }
      }
      
      const assessmentCompanies = assessmentData || [];
      
      const uniqueCompanies = new Set([
        ...valuationCompanies.map(item => item.company_name),
        ...assessmentCompanies.map(item => item.company_name)
      ].filter(Boolean));

      setPreviousCompanies(Array.from(uniqueCompanies).map(name => ({ name })));
      
      if (uniqueCompanies.size > 0) {
        setShowCompanySelector(true);
      } else {
        setShowNewCompanyInput(true);
      }
    } catch (error: any) {
      console.error('Error fetching previous companies:', error);
      setShowNewCompanyInput(true);
    }
  };

  const findOrCreateCompany = async (name: string) => {
    if (!user) {
      toast({
        title: "Kirjautuminen vaaditaan",
        description: "Sinun täytyy kirjautua sisään käyttääksesi tätä toimintoa.",
        variant: "destructive"
      });
      return null;
    }

    try {
      console.log("[InitialSelectionStep] Finding or creating company:", name);
      
      const { data: existingCompanies, error: fetchError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', name)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (existingCompanies) {
        console.log("[InitialSelectionStep] Found existing company:", existingCompanies.id);
        setCompanyId(existingCompanies.id);
        return existingCompanies.id;
      }
      
      console.log("[InitialSelectionStep] Creating new company:", name);
      const { data: newCompany, error: insertError } = await supabase
        .from('companies')
        .insert({
          name: name,
          user_id: user.id
        })
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      
      console.log("[InitialSelectionStep] Created new company:", newCompany.id);
      setCompanyId(newCompany.id);
      return newCompany.id;
    } catch (err: any) {
      console.error("[InitialSelectionStep] Error finding or creating company:", err);
      toast({
        title: "Virhe",
        description: "Yritystietojen käsittelyssä tapahtui virhe.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleCompanySelect = async (selectedName: string) => {
    setCompanyName(selectedName);
    const id = await findOrCreateCompany(selectedName);
    if (id) {
      setShowCompanySelector(false);
      setShowNewCompanyInput(false);
      setLocalError("");
    }
  };

  const handleNewCompany = () => {
    setShowCompanySelector(false);
    setShowNewCompanyInput(true);
  };

  const handleCompanySubmit = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Virhe",
        description: "Syötä yrityksen nimi ennen jatkamista.",
        variant: "destructive"
      });
      return;
    }
    
    const id = await findOrCreateCompany(companyName);
    if (id) {
      setShowNewCompanyInput(false);
      setLocalError("");
    }
  };

  const localHandleStart = () => {
    setLocalError("");
    if (!companyId) {
      setLocalError("Valitse tai lisää yritys ennen jatkamista.");
      toast({
        title: "Virhe",
        description: "Valitse tai lisää yritys ennen jatkamista.",
        variant: "destructive"
      });
      return;
    }
    
    handleStart();
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Aloita myyntikuntoisuusarviointi</h2>
        <p className="text-gray-600">Valitse yritys ja haluamasi dokumentit arviointia varten</p>
      </div>

      {showCompanySelector && (
        <Card>
          <CardHeader>
            <CardTitle>Valitse yritys</CardTitle>
            <CardDescription>
              Valitse aiemmin käyttämäsi yritys tai aloita uudella
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {previousCompanies.map((company, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left mb-2 flex items-center"
                  onClick={() => handleCompanySelect(company.name)}
                >
                  <FileBarChart className="mr-2 h-4 w-4 text-indigo-500" />
                  {company.name}
                </Button>
              ))}
              <Button
                variant="default"
                className="w-full mt-4"
                onClick={handleNewCompany}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Aloita uudella yrityksellä
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showNewCompanyInput && (
        <Card>
          <CardHeader>
            <CardTitle>Uusi yritys</CardTitle>
            <CardDescription>
              Syötä uuden yrityksen nimi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Input
                type="text"
                placeholder="Yrityksen nimi"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Button onClick={handleCompanySubmit}>Jatka</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {companyId && (
        <div className="mt-8">
          <DocumentSelectionStep
            companyId={companyId}
            handleNext={() => {}}
            handlePrevious={() => {}}
            onDocumentsSelected={onDocumentsSelected}
            standalone={true}
          />
        </div>
      )}

      {companyId && (
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Arviointi kestää noin 1-2 minuuttia, riippuen dokumenttien määrästä ja koosta.
          </p>
          <Button 
            size="lg"
            onClick={localHandleStart}
            disabled={isLoading}
            className="w-full max-w-md rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Käsitellään...
              </>
            ) : (
              'Aloita myyntikuntoisuuden arviointi'
            )}
          </Button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {localError && <p className="text-red-500 mt-2">{localError}</p>}
        </div>
      )}
    </div>
  );
};

export default InitialSelectionStep;
