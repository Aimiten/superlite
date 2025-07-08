import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles, RefreshCw, Check, Clock, ArrowRight, Edit, FileText } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Tyyppi ehdotukselle, tämä voidaan myöhemmin siirtää omaan types-tiedostoonsa
export interface ExitSuggestion {
  exitType: string;
  exitTypeDescription: string;
  timeline: string;
  timelineDescription: string;
  reasoning: string;
}

interface ExitSuggestionCardProps {
  suggestion: ExitSuggestion;
  suggestedIssues: string[];
  onAccept: () => void;
  onModify: (exitType: string, timeline: string) => void;
  isLoading: boolean;
  isUpdatingSuggestion?: boolean;
}

export const ExitSuggestionCard: React.FC<ExitSuggestionCardProps> = ({
  suggestion,
  suggestedIssues,
  onAccept,
  onModify,
  isLoading = false,
  isUpdatingSuggestion = false,
}) => {
  const [exitType, setExitType] = useState(suggestion.exitType);
  const [timeline, setTimeline] = useState(suggestion.timeline);
  const [isEditing, setIsEditing] = useState(false);

  const handleExitTypeChange = (value: string) => {
    setExitType(value);
  };

  const handleTimelineChange = (value: string) => {
    setTimeline(value);
  };

  const handleModifySubmit = () => {
    onModify(exitType, timeline);
    setIsEditing(false);
  };

  // Apufunktio tyyppien näyttämiseen suomeksi
  const getExitTypeLabel = (type: string): string => {
    switch (type) {
      case "share_sale": return "Osakekauppa";
      case "business_sale": return "Liiketoimintakauppa";
      case "generational_change": return "Sukupolvenvaihdos";
      case "other": return "Muu järjestely";
      default: return type;
    }
  };

  // Apufunktio aikataulujen näyttämiseen suomeksi
  const getTimelineLabel = (time: string): string => {
    switch (time) {
      case "immediate": return "Välitön (0-6kk)";
      case "short_term": return "Lyhyt (6-12kk)";
      case "mid_term": return "Keskipitkä (1-2 vuotta)";
      case "long_term": return "Pitkä (3-5 vuotta)";
      default: return time;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto overflow-hidden border border-slate-200 shadow-lg transition-all duration-200 hover:shadow-xl rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-2">
          <div className="bg-indigo-100 rounded-full p-2 text-indigo-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Ehdotus omistajanvaihdoksen tavasta ja aikataulusta</CardTitle>
            <CardDescription className="text-sm text-slate-600 mt-1">
              Tekoäly on analysoinut yrityksesi tilanteen ja ehdottaa seuraavaa:
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {!isEditing ? (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-indigo-500" />
                  Omistajanvaihdoksen tyyppi
                </h3>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-lg font-semibold text-slate-800 mb-1">{suggestion.exitTypeDescription}</p>
                  <div className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                    {getExitTypeLabel(suggestion.exitType)}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  Aikataulu
                </h3>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-lg font-semibold text-slate-800 mb-1">{suggestion.timelineDescription}</p>
                  <div className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {getTimelineLabel(suggestion.timeline)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-500" />
                Perustelut
              </h3>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                <p className="text-slate-700 text-sm leading-relaxed">{suggestion.reasoning}</p>
              </div>
            </div>

            {suggestedIssues.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Tärkeimmät kehityskohteet
                </h3>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 shadow-sm">
                  <ul className="space-y-2">
                    {suggestedIssues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                        <div className="rounded-full bg-amber-200 p-0.5 mt-0.5">
                          <Check className="h-3 w-3 text-amber-700" />
                        </div>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-6 border border-slate-200 rounded-xl p-4 bg-slate-50">
              <div className="space-y-4">
                <h3 className="font-medium text-slate-800">Omistajanvaihdoksen tyyppi</h3>
                <RadioGroup value={exitType} onValueChange={handleExitTypeChange} className="gap-3">
                  <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-200 transition-all hover:border-indigo-200 hover:bg-blue-50">
                    <RadioGroupItem value="share_sale" id="share_sale" className="text-indigo-600" />
                    <Label htmlFor="share_sale" className="font-medium cursor-pointer">Osakekauppa</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-200 transition-all hover:border-indigo-200 hover:bg-blue-50">
                    <RadioGroupItem value="business_sale" id="business_sale" className="text-indigo-600" />
                    <Label htmlFor="business_sale" className="font-medium cursor-pointer">Liiketoimintakauppa</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-200 transition-all hover:border-indigo-200 hover:bg-blue-50">
                    <RadioGroupItem value="generational_change" id="generational_change" className="text-indigo-600" />
                    <Label htmlFor="generational_change" className="font-medium cursor-pointer">Sukupolvenvaihdos</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-200 transition-all hover:border-indigo-200 hover:bg-blue-50">
                    <RadioGroupItem value="other" id="other" className="text-indigo-600" />
                    <Label htmlFor="other" className="font-medium cursor-pointer">Muu järjestely</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="font-medium text-slate-800">Aikataulu</h3>
                <RadioGroup value={timeline} onValueChange={handleTimelineChange} className="gap-3">
                  <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-200 transition-all hover:border-indigo-200 hover:bg-blue-50">
                    <RadioGroupItem value="immediate" id="immediate" className="text-indigo-600" />
                    <Label htmlFor="immediate" className="font-medium cursor-pointer">Välitön (0-6kk)</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-200 transition-all hover:border-indigo-200 hover:bg-blue-50">
                    <RadioGroupItem value="short_term" id="short_term" className="text-indigo-600" />
                    <Label htmlFor="short_term" className="font-medium cursor-pointer">Lyhyt (6-12kk)</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-200 transition-all hover:border-indigo-200 hover:bg-blue-50">
                    <RadioGroupItem value="mid_term" id="mid_term" className="text-indigo-600" />
                    <Label htmlFor="mid_term" className="font-medium cursor-pointer">Keskipitkä (1-2 vuotta)</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-200 transition-all hover:border-indigo-200 hover:bg-blue-50">
                    <RadioGroupItem value="long_term" id="long_term" className="text-indigo-600" />
                    <Label htmlFor="long_term" className="font-medium cursor-pointer">Pitkä (3-5 vuotta)</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className={cn(
        "flex justify-between gap-4 p-6 bg-slate-50 border-t border-slate-100",
        isEditing ? "flex-row" : "flex-col sm:flex-row"
      )}>
        {!isEditing ? (
          <>
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <Edit className="h-4 w-4" />
              Muokkaa ehdotusta
            </Button>
            <Button 
              onClick={onAccept} 
              size="lg" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {isUpdatingSuggestion ? "Päivitetään ehdotusta..." : "Luodaan tehtäviä..."}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Hyväksy ja jatka tehtävien luontiin
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Peruuta
            </Button>
            <Button 
              onClick={handleModifySubmit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              Tallenna muutokset
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default ExitSuggestionCard;