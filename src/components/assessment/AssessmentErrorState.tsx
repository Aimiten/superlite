
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface AssessmentErrorStateProps {
  handleResetAssessment: () => void;
  isSessionRecovering: boolean;
}

const AssessmentErrorState: React.FC<AssessmentErrorStateProps> = ({
  handleResetAssessment,
  isSessionRecovering
}) => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Virhe sovelluksessa</AlertTitle>
        <AlertDescription>
          Sovelluksessa tapahtui virhe. Voit yrittää nollata arvioinnin jatkaaksesi.
        </AlertDescription>
      </Alert>
      
      <Card className="w-full p-6 text-center">
        <CardContent className="pt-6">
          <p className="mb-6 text-muted-foreground">
            Arvioinnissa tapahtui virhe, joka esti sovelluksen toiminnan. Tämä voi johtua keskeneräisestä arviointiprosessista tai tietojenkäsittelyvirheestä.
          </p>
          <Button 
            variant="destructive" 
            onClick={handleResetAssessment} 
            disabled={isSessionRecovering}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            {isSessionRecovering ? "Nollataan..." : "Nollaa arviointi ja aloita alusta"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentErrorState;
