
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import CompanyDataCard from "./CompanyDataCard";

type CompanyData = {
  company_name?: string;
  business_id?: string;
  industry?: string;
  founded?: string;
  employees?: string;
  revenue?: string | number;
  description?: string;
  competitive_advantages?: string[];
  market_position?: string;
  challenges?: string[];
  key_products?: string[];
  website?: string;
};

interface CompanyAnalysisStepProps {
  structuredCompanyData: CompanyData | null;
  companyInfo: string;
  handleNext: () => void;
  handlePrevious: () => void;
}

const CompanyAnalysisStep: React.FC<CompanyAnalysisStepProps> = ({
  structuredCompanyData,
  companyInfo,
  handleNext,
  handlePrevious,
}) => {
  return (
    <Card className="card-3d mb-8">
      <CardHeader className="pb-4">
        <Badge variant="outline" className="mb-2 w-fit rounded-full">
          Vaihe 2: Yritystiedot
        </Badge>
        <CardTitle>Yrityksen tiedot</CardTitle>
        <CardDescription>
          Tarkista ja tarvittaessa täydennä yrityksestäsi löydetyt tiedot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <CompanyDataCard 
            structuredCompanyData={structuredCompanyData} 
            companyInfo={companyInfo} 
          />
          
          <div className="space-y-2">
            <Label htmlFor="company-details">Lisätiedot (valinnainen)</Label>
            <Input
              id="company-details"
              placeholder="Täydennä tietoja tarvittaessa"
              className="rounded-xl"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" onClick={handlePrevious} className="rounded-full">
          Edellinen
        </Button>
        <Button onClick={handleNext} className="rounded-full">
          Seuraava
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CompanyAnalysisStep;
