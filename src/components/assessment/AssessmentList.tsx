import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileBarChart, Calendar, ArrowRight, Loader2, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { fi } from "date-fns/locale";

interface SavedAssessment {
  id: string;
  user_id: string;
  company_name: string;
  results: any;
  created_at: string;
  answers?: Record<string, any>;
}

interface AssessmentListProps {
  savedAssessments: SavedAssessment[];
  isLoading: boolean;
  isRefreshingAssessments: boolean;
  handleSelectAssessment: (assessment: SavedAssessment) => void;
  handleStartNewAssessment: () => void;
  fetchSavedAssessments: () => Promise<void>;
}

const AssessmentList: React.FC<AssessmentListProps> = ({
  savedAssessments,
  isLoading,
  isRefreshingAssessments,
  handleSelectAssessment,
  handleStartNewAssessment,
  fetchSavedAssessments
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Button
          variant="outline" 
          onClick={() => fetchSavedAssessments()}
          disabled={isRefreshingAssessments}
          className="flex items-center gap-2"
        >
          {isRefreshingAssessments ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          Päivitä
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : savedAssessments.length === 0 ? (
        <Card className="text-center p-8 my-12">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-6">
              Sinulla ei ole vielä tallennettuja myyntikuntoisuusarviointeja.
            </p>
            <Button 
              onClick={handleStartNewAssessment} 
              className="rounded-full"
            >
              Aloita ensimmäinen arviointi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {savedAssessments.map((assessment) => (
            <Card 
              key={assessment.id} 
              className="hover:border-indigo-200 transition-colors cursor-pointer"
              onClick={() => handleSelectAssessment(assessment)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 p-2 rounded-full mr-4">
                      <FileBarChart className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{assessment.company_name || "Nimetön yritys"}</h3>
                      <div className="flex items-center text-sm text-slate-500">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {format(new Date(assessment.created_at), "d.M.yyyy HH:mm", { locale: fi })}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  >
                    Tarkastele <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssessmentList;