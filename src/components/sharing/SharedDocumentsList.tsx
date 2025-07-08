import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, File, FilePlus, FileCheck } from "lucide-react";
import { format } from "date-fns";
import { fi } from "date-fns/locale";

// Ympäristömuuttuja Supabase URL:lle
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";

interface SharedDocument {
  id: string;
  name: string;
  description?: string;
  type?: string;
  created_at: string;
  file_path: string;
  source: string;
  signedUrl?: string; // Lisätty signedUrl-kenttä
}

interface SharedDocumentsListProps {
  documents: SharedDocument[];
  companyName: string;
}

const SharedDocumentsList: React.FC<SharedDocumentsListProps> = ({ documents, companyName }) => {
  // Funktio dokumentin tyypin ikonin valintaan
  const getDocumentIcon = (doc: SharedDocument) => {
    if (doc.source === 'task_responses') {
      return <FileCheck className="h-5 w-5 text-blue-500" />;
    }

    switch (doc.type?.toLowerCase()) {
      case 'excel':
      case 'spreadsheet':
      case 'csv':
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'word':
      case 'document':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'presentation':
        return <FilePlus className="h-5 w-5 text-orange-600" />;
      default:
        return <File className="h-5 w-5 text-slate-600" />;
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dokumentit</CardTitle>
          <CardDescription>Jaetut dokumentit yrityksestä {companyName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ei jaettuja dokumentteja</h3>
            <p className="text-slate-500">Tähän jakoon ei ole liitetty dokumentteja.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dokumentit</CardTitle>
        <CardDescription>Jaetut dokumentit yrityksestä {companyName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map(doc => (
            <div 
              key={`${doc.source}-${doc.id}`} 
              className="border rounded-md p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {getDocumentIcon(doc)}
                  </div>
                  <div>
                    <h3 className="font-medium">{doc.name}</h3>
                    {doc.description && (
                      <p className="text-sm text-slate-500 mt-1">{doc.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                      <span>
                        Lisätty: {format(new Date(doc.created_at), 'dd.MM.yyyy', { locale: fi })}
                      </span>
                      {doc.source === 'company_documents' && (
                        <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                          Yrityksen dokumentti
                        </span>
                      )}
                      {doc.source === 'task_responses' && (
                        <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                          Tehtävän liite
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                >
                  <a 
                    href={doc.signedUrl || `${SUPABASE_URL}/storage/v1/object/public/${doc.file_path}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download={doc.name}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Lataa
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SharedDocumentsList;