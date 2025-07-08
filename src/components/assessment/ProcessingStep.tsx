
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface ProcessingStepProps {
  error: string;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({ error }) => {
  return (
    <Card className="card-3d mb-8">
      <CardHeader className="pb-4 text-center">
        <CardTitle>Analysoidaan tietoja</CardTitle>
        <CardDescription>
          Odota hetki, kun analysoimme yrityksesi tietoja ja arvioimme myyntikuntoisuutta.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="relative h-24 w-24 mb-8">
          <RefreshCw className="h-24 w-24 text-purple-500 animate-spin" />
        </div>
        <p className="text-gray-600 text-center max-w-md">
          OpenAI, Perplexity ja Gemini -tekoälyt analysoivat yrityksesi tilinpäätöstietoja, vastauksiasi sekä muita tietoja
          ja laativat kattavan arvion myyntikuntoisuudesta sekä kehitysehdotukset.
        </p>
        
        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm max-w-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingStep;
