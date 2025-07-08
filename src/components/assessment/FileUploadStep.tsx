
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Upload, Check, Loader2, FileSearch, FileX, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface FileUploadStepProps {
  fileUploaded: boolean;
  fileName: string;
  isLoading: boolean;
  error: string;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNext: () => void;
  handlePrevious: () => void;
}

const FileUploadStep: React.FC<FileUploadStepProps> = ({
  fileUploaded,
  fileName,
  isLoading,
  error,
  handleFileUpload,
  handleNext,
  handlePrevious,
}) => {
  const navigate = useNavigate();

  const handleNavigateToProfile = () => {
    navigate("/profile");
  };

  return (
    <Card className="card-3d mb-8">
      <CardHeader className="pb-4">
        <Badge variant="outline" className="mb-2 w-fit rounded-full">
          Vaihe 3: Dokumentit
        </Badge>
        <CardTitle>Tilinpäätöstiedot</CardTitle>
        <CardDescription>
          Lataa viimeisin tilinpäätös analyysiä varten. Gemini-tekoäly analysoi tilinpäätöstietosi tunnistaen tuloslaskelman ja taseen luvut oikein.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center">
          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Lataa tilinpäätöstiedot
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            PDF, Excel tai CSV muodossa
          </p>
          <div className="flex flex-col md:flex-row gap-3 justify-center mb-4">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.xlsx,.csv,.txt"
            />
            <Button asChild variant="outline" className="relative rounded-full" disabled={isLoading}>
              <label htmlFor="file-upload" className="cursor-pointer flex items-center">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analysoidaan...
                  </>
                ) : fileUploaded ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Vaihda tiedosto
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Valitse tiedosto
                  </>
                )}
              </label>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleNavigateToProfile}
              className="rounded-full"
            >
              Siirry hallinnoimaan dokumentteja
            </Button>
          </div>
          
          <div className="flex flex-col items-center mt-2">
            <Badge variant="secondary" className="mb-2 flex items-center gap-1">
              <FileSearch className="h-3 w-3" />
              PDF-tiedostot ensisijaisia
            </Badge>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              PDF-tiedostot ovat suositeltuja, koska Gemini-tekoäly analysoi niistä visuaalisen sisällön, mukaan lukien taulukot, luvut ja kaaviot oikein
            </p>
          </div>
          
          {fileUploaded && (
            <div className="mt-4 flex flex-col items-center justify-center">
              {isLoading ? (
                <div className="flex items-center text-blue-600">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Analysoidaan tiedostoa...</span>
                </div>
              ) : (
                <div className="flex items-center text-green-600">
                  <Check className="mr-2 h-4 w-4" />
                  <span>{fileName || "Tiedosto ladattu"}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl text-purple-700 text-sm">
          <div className="flex gap-2 mb-2">
            <h4 className="font-medium">Tilinpäätöstietojen analysointi</h4>
          </div>
          <p className="mb-2">Tilinpäätöstietojasi analysoidaan Gemini-tekoälyn avulla, joka ymmärtää myös PDF-tiedostojen visuaalisen sisällön. Järjestelmä laskee tunnusluvut seuraavilla kaavoilla:</p>
          
          <div className="pl-3 border-l-2 border-purple-300 my-2">
            <p className="font-medium">EBIT (liikevoitto) = Liikevaihto + Liiketoiminnan muut tuotot - Materiaalit - Henkilöstökulut - Muut kulut - Poistot</p>
            <p className="font-medium mt-1">EBITDA (käyttökate) = EBIT + Poistot</p>
            <p className="font-medium mt-1">ROE (oman pääoman tuotto) = Tilikauden tulos / Oma pääoma × 100%</p>
            <p className="font-medium mt-1">Omavaraisuusaste = Oma pääoma / Taseen loppusumma × 100%</p>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Virhe tiedoston analysoinnissa</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
              <p className="mt-1">Voit silti jatkaa oletuskysymyksillä.</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" onClick={handlePrevious} className="rounded-full">
          Edellinen
        </Button>
        <Button onClick={handleNext} className="rounded-full">
          {fileUploaded && !isLoading ? "Seuraava" : "Ohita tämä vaihe"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FileUploadStep;
