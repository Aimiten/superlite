import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface DocumentSelectorProps {
  companyId: string;
  selectedDocuments: { id: string; source: string }[];
  onDocumentsChange: (documents: { id: string; source: string }[]) => void;
}

interface Document {
  id: string;
  name: string;
  description?: string;
  file_path: string;
  source: string;
  metadata?: any;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  companyId,
  selectedDocuments,
  onDocumentsChange,
}) => {
  const { toast } = useToast();
  const [companyDocuments, setCompanyDocuments] = useState<Document[]>([]);
  const [taskDocuments, setTaskDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!companyId) return;

      setLoading(true);
      try {
        // Hae yrityksen dokumentit
        const { data: companyDocs, error: companyDocsError } = await supabase
          .from('company_documents')
          .select('*')
          .eq('company_id', companyId);

        if (companyDocsError) throw companyDocsError;

        setCompanyDocuments((companyDocs || []).map(doc => ({
          id: doc.id,
          name: doc.name,
          description: doc.description,
          file_path: doc.file_path,
          source: 'company_documents',
          metadata: {
            document_type: doc.document_type,
            created_at: doc.created_at
          }
        })));

        // Hae tehtävien dokumentit
        const { data: tasks, error: tasksError } = await supabase
          .from('company_tasks')
          .select('id, title')
          .eq('company_id', companyId);

        if (tasksError) throw tasksError;

        const taskIds = tasks?.map(t => t.id) || [];
        if (taskIds.length > 0) {
          const { data: taskDocs, error: taskDocsError } = await supabase
            .from('task_responses')
            .select('*, task_id')
            .in('task_id', taskIds)
            .not('file_path', 'is', null);

          if (taskDocsError) throw taskDocsError;

          // Yhdistä tehtävien tiedot dokumentteihin
          const docsWithTaskInfo = (taskDocs || []).map(doc => {
            const task = tasks?.find(t => t.id === doc.task_id);
            return {
              id: doc.id,
              name: doc.file_name || 'Nimetön liite',
              description: `Tehtävä: ${task?.title || 'Tuntematon tehtävä'}`,
              file_path: doc.file_path,
              source: 'task_responses',
              metadata: {
                task_id: doc.task_id,
                task_title: task?.title,
                created_at: doc.created_at
              }
            };
          });

          setTaskDocuments(docsWithTaskInfo);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: "Virhe",
          description: "Dokumenttien hakeminen epäonnistui",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [companyId, toast]);

  const isDocumentSelected = (id: string, source: string) => {
    return selectedDocuments.some(doc => doc.id === id && doc.source === source);
  };

  const toggleDocument = (id: string, source: string, checked: boolean) => {
    if (checked) {
      onDocumentsChange([...selectedDocuments, { id, source }]);
    } else {
      onDocumentsChange(selectedDocuments.filter(
        doc => !(doc.id === id && doc.source === source)
      ));
    }
  };

  return (
    <div className="space-y-4">
      <Label>Valitse jaettavat dokumentit</Label>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">Ladataan dokumentteja...</span>
        </div>
      ) : (
        <>
          {/* Yrityksen dokumentit */}
          {companyDocuments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Yrityksen dokumentit</h4>
              <ScrollArea className="h-40 border rounded-md p-2">
                {companyDocuments.map(doc => (
                  <div key={doc.id} className="flex items-center space-x-2 py-1.5">
                    <Checkbox 
                      id={`company-doc-${doc.id}`} 
                      checked={isDocumentSelected(doc.id, doc.source)}
                      onCheckedChange={(checked) => toggleDocument(doc.id, doc.source, !!checked)}
                    />
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`company-doc-${doc.id}`} className="cursor-pointer">
                        {doc.name} 
                        {doc.metadata?.document_type && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({doc.metadata.document_type})
                          </span>
                        )}
                      </Label>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {/* Tehtävien dokumentit */}
          {taskDocuments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Tehtäviin liittyvät dokumentit</h4>
              <ScrollArea className="h-40 border rounded-md p-2">
                {taskDocuments.map(doc => (
                  <div key={doc.id} className="flex items-center space-x-2 py-1.5">
                    <Checkbox 
                      id={`task-doc-${doc.id}`} 
                      checked={isDocumentSelected(doc.id, doc.source)}
                      onCheckedChange={(checked) => toggleDocument(doc.id, doc.source, !!checked)}
                    />
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`task-doc-${doc.id}`} className="cursor-pointer">
                        {doc.name}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({doc.description})
                        </span>
                      </Label>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {companyDocuments.length === 0 && taskDocuments.length === 0 && (
            <div className="text-sm text-muted-foreground py-4 text-center border border-border rounded-md">
              Ei jaettavia dokumentteja saatavilla.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentSelector;