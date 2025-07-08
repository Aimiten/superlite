 import React, { useState, useEffect } from 'react';
 import {
   Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Eye, Edit, Loader2, AlertCircle } from "lucide-react";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 import ReactMarkdown from 'react-markdown';
 import DOMPurify from "dompurify";

 // Tuodaan olemassa olevat vastauskomponentit
 import {
   TextResponse,
   FileUploadResponse,
   CheckboxResponse,
   MultiChoiceResponse,
   ContactInfoResponse
 } from "./response";

 interface TaskResponseModalProps {
   isOpen: boolean;
   onClose: () => void;
   task: any;
   onSaveResponse: (taskId: string, value: any) => Promise<void>;
   onComplete?: (taskId: string, isCompletedCurrently: boolean) => Promise<void>; // Uusi prop
 }

 const TaskResponseModal: React.FC<TaskResponseModalProps> = ({
   isOpen,
   onClose,
   task,
   onSaveResponse,
   onComplete
 }) => {
   const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
   const [saving, setSaving] = useState(false);
   const [validationError, setValidationError] = useState<string | null>(null);

  // Helper funktio tarkistamaan onko tehtävällä oikeasti sisältöä
  const hasActualResponse = (task: any): boolean => {
    if (!task?.value) return false;
    
    switch (task.type) {
      case 'text_input':
      case 'explanation':
        return !!(task.value.text && task.value.text.trim());
      case 'checkbox':
        return task.value.checked === true;
      case 'multiple_choice':
        return !!(task.value.options && Array.isArray(task.value.options) && task.value.options.length > 0);
      case 'contact_info':
        return !!(task.value.contact && task.value.contact.name && task.value.contact.name.trim());
      case 'document_upload':
        return !!(
          (task.value.filePath && task.value.fileName) || 
          (task.value.textResponse && task.value.textResponse.trim())
        );
      default:
        return Object.keys(task.value).length > 0;
    }
  };

   // Päivitä aktiivinen välilehti kun tehtävä muuttuu
   useEffect(() => {
     if (isOpen && task) {
       // Jos tehtävällä ei ole vielä vastausta, näytä muokkaustila
       if (!hasActualResponse(task)) {
         setActiveTab('edit');
       } else {
         setActiveTab('view');
       }
     }
   }, [task, isOpen]);

   // Aseta tallennustila ja validointivirhe pois päältä kun modaali suljetaan
   useEffect(() => {
     if (!isOpen) {
       setSaving(false);
       setValidationError(null);
     }
   }, [isOpen]);

   // Validointi: Tarkistaa onko vastaus kelvollinen
   const isValidResponse = (type: string, value: any): boolean => {
     if (!value) return false;

     switch (type) {
       case 'text_input':
       case 'explanation':
         return value.text && value.text.trim().length > 0;

       case 'checkbox':
         return value.checked !== undefined;

       case 'multiple_choice':
         return value.options && Array.isArray(value.options) && value.options.length > 0;

       case 'contact_info':
         return value.contact && value.contact.name && value.contact.name.trim().length > 0;

       case 'document_upload':
         // Hyväksy vastaus aina document_upload tyypille
         // Tämä sallii sekä tiedoston poiston että tyhjän vastauksen
         return true;


       default:
         return true;
     }
   };

   // Vastauksen tallennus
   const handleSaveResponse = async (taskId: string, value: any) => {
     // Tyhjennä aiempi virheilmoitus
     setValidationError(null);

     // Validoi vastaus
     if (!isValidResponse(task.type, value)) {
       // Näytetään sopiva virheilmoitus
       let errorMsg = "Vastaus ei kelpaa tallennettavaksi";

       if (task.type === 'text_input' || task.type === 'explanation') {
         errorMsg = "Tekstikenttä ei voi olla tyhjä";
       } else if (task.type === 'multiple_choice') {
         errorMsg = "Valitse vähintään yksi vaihtoehto";
       } else if (task.type === 'contact_info') {
         errorMsg = "Nimi on pakollinen tieto";
       }

       setValidationError(errorMsg);
       return;
     }

     setSaving(true);
     try {
       await onSaveResponse(taskId, value);

       // Jos tehtävä ei ole jo valmis ja onComplete callback on annettu, merkitse valmiiksi
       if (task.completion_status !== 'completed' && onComplete) {
         await onComplete(taskId, false);
       }

       // Siirry katselutilaan tallennuksen jälkeen
       setActiveTab('view');
     } catch (error) {
       console.error("Error saving response:", error);
       setValidationError("Tallennuksessa tapahtui virhe");
     } finally {
       setSaving(false);
     }
   };

   // Renderöi vastauksen sisältö katselutilassa
   const renderTaskValue = (value: any) => {
     if (!value) return <p className="text-slate-500 italic">Ei vastausta</p>;

     // Jos value on string
     if (typeof value === 'string') {
       return <div className="whitespace-pre-wrap">{value}</div>;
     }

     // Jos value on boolean
     if (typeof value === 'boolean') {
       return value ? <span className="text-green-600">Kyllä</span> : <span className="text-red-600">Ei</span>
     }

     // Jos value on objekti, käsittele eri tyypit
     if (typeof value === 'object') {
       // Jos on kyse text-tyyppisestä vastauksesta
       if (value.text) {
         return <div className="whitespace-pre-wrap">{value.text}</div>;
       }

       // Jos on checked-tyyppinen
       if (value.checked !== undefined) {
         return value.checked ?
           <span className="text-green-600">Kyllä</span> :
           <span className="text-red-600">Ei</span>;
       }

       // Jos on contact-tyyppinen
       if (value.contact) {
         return (
           <div className="space-y-1">
             <p><strong>Nimi:</strong> {value.contact.name || '-'}</p>
             <p><strong>Sähköposti:</strong> {value.contact.email || '-'}</p>
             <p><strong>Puhelin:</strong> {value.contact.phone || '-'}</p>
             {value.contact.company && <p><strong>Yritys:</strong> {value.contact.company}</p>}
           </div>
         );
       }

       // Jos on options-tyyppinen (monivalinta)
       if (value.options && Array.isArray(value.options)) {
         return (
           <div>
             <p><strong>Valitut vaihtoehdot:</strong></p>
             <ul className="list-disc pl-5 mt-1">
               {value.options.map((option, index) => (
                 <li key={index}>{option}</li>
               ))}
             </ul>
           </div>
         );
       }

       // Tekstivastaus document_upload-tyyppisessä tehtävässä
       if (value.textResponse) {
         return <div className="whitespace-pre-wrap">{value.textResponse}</div>;
       }

       // Tarkista onko text-kenttä (AI:n tallentama vastaus)
       if (value.text) {
         return (
           <div className="prose prose-sm max-w-none">
             <div dangerouslySetInnerHTML={{ 
               __html: DOMPurify.sanitize(value.text, {
                 ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'blockquote'],
                 ALLOWED_ATTR: ['href', 'target', 'rel']
               })
             }} />
           </div>
         );
       }

       // Muut vastausarvot näytetään rakenteisesti
       return (
         <div className="space-y-2">
           {Object.entries(value)
             .filter(([key]) => !['copiedFromAI', 'generatedByAI', 'copiedAt', 'generatedAt',
 'editedAt'].includes(key))
             .map(([key, val]) => (
               <div key={key}>
                 <strong>{key}:</strong> {typeof val === 'string' ? val : JSON.stringify(val)}
               </div>
             ))
           }
         </div>
       );
     }

     // Jos mikään muu ei toimi, muunna JSON-muotoon
     return <pre className="text-xs overflow-auto whitespace-pre-wrap bg-slate-100 p-2 
 rounded">{JSON.stringify(value, null, 2)}</pre>;
   };

   // Renderöi sopiva muokkauskomponentti tehtävätyypin perusteella
   const renderEditComponent = () => {
     if (!task) return null;

     switch (task.type) {
       case 'checkbox':
         return (
           <CheckboxResponse
             taskId={task.id}
             value={task.value}
             onSave={(value) => handleSaveResponse(task.id, value)}
           />
         );

       case 'text_input':
       case 'explanation':
         return (
           <TextResponse
             taskId={task.id}
             value={task.value}
             onSave={(value) => handleSaveResponse(task.id, value)}
             multiline={true}
             minHeight={task.type === 'explanation' ? "200px" : "120px"}
           />
         );

       case 'document_upload':
         return (
           <FileUploadResponse
             taskId={task.id}
             companyId={task.company_id}
             value={task.value}
             onSave={(value) => handleSaveResponse(task.id, value)}
           />
         );

       case 'multiple_choice':
         return (
           <MultiChoiceResponse
             taskId={task.id}
             options={task.options || []}
             value={task.value}
             onSave={(value) => handleSaveResponse(task.id, value)}
             allowMultiple={true}
           />
         );

       case 'contact_info':
         return (
           <ContactInfoResponse
             taskId={task.id}
             value={task.value}
             onSave={(value) => handleSaveResponse(task.id, value)}
           />
         );

       default:
         return <p>Tuntematon tehtävätyyppi: {task.type}</p>;
     }
   };

   if (!task) return null;

   return (
     <Dialog open={isOpen} onOpenChange={onClose}>
       <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] p-3 sm:p-6 overflow-y-auto w-[95vw] 
 sm:w-auto">
         <DialogHeader className="space-y-1">
           <DialogTitle className="text-base sm:text-lg">{task.title}</DialogTitle>
           <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
         </DialogHeader>

         <div className="py-2 sm:py-4">
           {/* Validointivirhe */}
           {validationError && (
             <Alert variant="destructive" className="mb-4">
               <AlertCircle className="h-4 w-4" />
               <AlertDescription>
                 {validationError}
               </AlertDescription>
             </Alert>
           )}

           {/* Välilehdet: Katselutila ja Muokkaustila */}
           <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'view' | 'edit')}>
             <TabsList className="grid w-full grid-cols-2">
               <TabsTrigger value="view" className="text-sm py-1.5">
                 <Eye className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                 <span>Katselutila</span>
               </TabsTrigger>
               <TabsTrigger 
                 value="edit" 
                 className="text-sm py-1.5"
                 onClick={() => {
                   // Jos tehtävä on valmis ja ollaan siirtymässä muokkaustilaan,
                   // merkitse se keskeneräiseksi
                   if (task.completion_status === 'completed' && onComplete) {
                     onComplete(task.id, true); // true = nykyinen tila on completed
                   }
                 }}
               >
                 <Edit className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                 <span>Muokkaa</span>
               </TabsTrigger>
             </TabsList>

             {/* Katselutilan sisältö */}
             <TabsContent value="view" className="pt-3">
               <div className="p-2 sm:p-4 bg-slate-50 rounded-lg">
                 <h3 className="text-sm font-medium mb-2">Vastaus:</h3>
                 {task.value ? (
                   <div className="prose prose-sm max-w-none">
                     {renderTaskValue(task.value)}
                   </div>
                 ) : (
                   <p className="text-center text-slate-500 italic py-4">
                     Ei vastausta
                   </p>
                 )}
               </div>
             </TabsContent>

             {/* Muokkaustilan sisältö */}
             <TabsContent value="edit" className="pt-3">
               {saving ? (
                 <div className="flex flex-col items-center justify-center py-8">
                   <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                   <p className="text-muted-foreground">Tallennetaan vastausta...</p>
                 </div>
               ) : (
                 renderEditComponent()
               )}
             </TabsContent>
           </Tabs>
         </div>

         <DialogFooter>
           <Button 
             onClick={onClose} 
             className="w-full sm:w-auto"
             variant="outline"
           >
             Sulje
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 };

 export default TaskResponseModal;