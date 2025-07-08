
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileBarChart } from "lucide-react";
import { Company } from "@/components/assessment/types";

interface CompanyName {
  name: string;
}

interface CompanySelectorProps {
  showCompanySelector: boolean;
  setShowCompanySelector: (show: boolean) => void;
  previousCompanies: CompanyName[];
  companies: Company[];
  handleCompanySelect: (companyName: string, companyId: string | null) => void;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({
  showCompanySelector,
  setShowCompanySelector,
  previousCompanies,
  companies,
  handleCompanySelect
}) => {
  return (
    <Dialog open={showCompanySelector} onOpenChange={setShowCompanySelector}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Valitse yritys</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Valitse aiemmin käyttämäsi yritys tai aloita uudella
          </p>
          {companies.map((company) => (
            <Button
              key={company.id}
              variant="outline"
              className="w-full justify-start text-left mb-2 flex items-center"
              onClick={() => handleCompanySelect(company.name, company.id)}
            >
              <FileBarChart className="mr-2 h-4 w-4 text-indigo-500" />
              {company.name}
            </Button>
          ))}
          {previousCompanies
            .filter(pc => !companies.some(c => c.name === pc.name))
            .map((company, index) => (
              <Button
                key={`prev-${index}`}
                variant="outline"
                className="w-full justify-start text-left mb-2 flex items-center"
                onClick={() => handleCompanySelect(company.name, null)}
              >
                <FileBarChart className="mr-2 h-4 w-4 text-indigo-500" />
                {company.name}
              </Button>
            ))}
          <Button
            variant="default"
            className="w-full mt-4"
            onClick={() => handleCompanySelect("Uusi yritys", null)}
          >
            Aloita uudella yrityksellä
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompanySelector;
