 import React, { useState, useRef, useCallback } from "react";
 import { Button } from "@/components/ui/button";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { usePersistentStorage } from "@/hooks/use-persistent-storage";
 import { TaskContext } from "./types";
 import DOMPurify from "dompurify";
 import {
   Bold, Italic, List, ListOrdered, Link, Heading, Save,
   MessageSquare, Loader2, Check, X
 } from "lucide-react";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Badge } from "@/components/ui/badge";
 import { Alert, AlertDescription } from "@/components/ui/alert";

 interface TaskEditorProps {
   taskContext: TaskContext;
   isOpen: boolean;
   onClose: () => void;
   onContentShare: (content: string) => void;
   onSaved?: () => void;
   initialContent?: string; // Mahdollinen alustava sisältö
 }

 // HTML to plain text conversion helper
 const htmlToPlainText = (html: string): string => {
   const tempDiv = document.createElement('div');
   tempDiv.innerHTML = html;
   return tempDiv.textContent || tempDiv.innerText || '';
 };

 // Debounce utility
 const debounce = (func: Function, wait: number) => {
   let timeout: NodeJS.Timeout | null = null;
   return (...args: any[]) => {
     if (timeout) clearTimeout(timeout);
     timeout = setTimeout(() => func(...args), wait);
   };
 };

 // DOMPurify configuration - centralized
 const SANITIZE_CONFIG = {
   ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'blockquote'],
   ALLOWED_ATTR: ['href', 'target', 'rel']
 };

 // Helper to save and restore cursor position
 const saveCursorPosition = (element: HTMLElement) => {
   const selection = window.getSelection();
   if (!selection || selection.rangeCount === 0) return null;

   const range = selection.getRangeAt(0);
   const preCaretRange = range.cloneRange();
   preCaretRange.selectNodeContents(element);
   preCaretRange.setEnd(range.endContainer, range.endOffset);

   return preCaretRange.toString().length;
 };

 const restoreCursorPosition = (element: HTMLElement, position: number | null) => {
   if (position === null) return;

   const selection = window.getSelection();
   const range = document.createRange();

   let currentPos = 0;
   let node: Node | null = null;
   let offset = 0;

   const walk = (n: Node): boolean => {
     if (n.nodeType === Node.TEXT_NODE) {
       const textLength = n.textContent?.length || 0;
       if (currentPos + textLength >= position) {
         node = n;
         offset = position - currentPos;
         return true;
       }
       currentPos += textLength;
     } else if (n.childNodes) {
       for (let i = 0; i < n.childNodes.length; i++) {
         if (walk(n.childNodes[i])) return true;
       }
     }
     return false;
   };

   walk(element);

   if (node) {
     try {
       range.setStart(node, offset);
       range.setEnd(node, offset);
       selection?.removeAllRanges();
       selection?.addRange(range);
     } catch (e) {
       // Failback: just focus the element
       element.focus();
     }
   }
 };

 const TaskWYSIWYGEditor: React.FC<TaskEditorProps> = ({
   taskContext,
   isOpen,
   onClose,
   onContentShare,
   onSaved,
   initialContent = "" // Oletusarvo tyhjä
 }) => {
   const [isSaving, setIsSaving] = useState(false);
   const [isSaved, setIsSaved] = useState(false);
   const [showConfirmDialog, setShowConfirmDialog] = useState(false);
   const { toast } = useToast();
   const editorRef = useRef<HTMLDivElement>(null);

   // Käytetään usePersistentStorage-hookia editorin sisällön tallentamiseen
   // Käytetään tehtäväkohtaista avainta
   const storageKey = `task_editor_content_${taskContext.taskId}`;

   // Alkuarvo on joko annettu initialContent tai oletus tehtävätiedoista
   const defaultContent = initialContent ||
     `<h2>${taskContext.taskTitle}</h2>\n<p>${taskContext.taskDescription}</p>`;

   const [editorContent, setEditorContent, refreshContent] = usePersistentStorage(
     storageKey,
     defaultContent,
     { debug: false } // Voit asettaa true kehitysaikana
   );

   // Tilamuuttuja joka kertoo, onko sisältöä
   const [hasContent, setHasContent] = useState(false);

   // Debounced sanitointi - suoritetaan vain kun käyttäjä pysähtyy kirjoittamasta
   const debouncedSanitize = useCallback(
     debounce((content: string) => {
       if (!editorRef.current) return;
       
       const sanitizedContent = DOMPurify.sanitize(content, SANITIZE_CONFIG);
       
       // Päivitä DOM vain jos sisältö muuttui
       if (content !== sanitizedContent) {
         // Tallenna kursorin sijainti ennen muutosta
         const cursorPos = saveCursorPosition(editorRef.current);
         
         // Päivitä DOM
         editorRef.current.innerHTML = sanitizedContent;
         setEditorContent(sanitizedContent);
         
         // Palauta kursori (vähän viiveellä DOM-päivityksen jälkeen)
         requestAnimationFrame(() => {
           if (editorRef.current) {
             restoreCursorPosition(editorRef.current, cursorPos);
           }
         });
       }
     }, 1000), // 1 sekunnin viive - vain kun käyttäjä pysähtyy
     []
   );

   // Alusta editorin sisältö kun se avataan
   React.useEffect(() => {
     if (isOpen && editorRef.current) {
       // Tarkista onko sisältö jo sama (vältetään turhat päivitykset)
       if (editorRef.current.innerHTML !== editorContent) {
         // Käytetään tallennettua sisältöä hookista
         editorRef.current.innerHTML = DOMPurify.sanitize(editorContent, SANITIZE_CONFIG);
       }
       // Tarkista onko sisältöä
       setHasContent(!!editorRef.current.textContent?.trim());
       // Aseta fokus editoriin
       editorRef.current.focus();
     }
   }, [isOpen]); // Poistetaan editorContent riippuvuudesta

   // Tallenna tehtävään
   const saveToTask = async () => {
     if (!taskContext.taskId || !editorRef.current || isSaving) return;

     setIsSaving(true);
     setShowConfirmDialog(false);

     try {
       // Käytetään sisältöä suoraan editorRef:stä ja sanitoidaan ennen tallennusta
       const rawContent = editorRef.current.innerHTML;
       const contentToSave = DOMPurify.sanitize(rawContent, SANITIZE_CONFIG);

       const { data, error } = await supabase.functions.invoke("update-task", {
         body: {
           taskId: taskContext.taskId,
           updateData: {
             completion_status: 'completed',
             value: {
               text: contentToSave,
               editedInChat: true,
               editedAt: new Date().toISOString()
             }
           }
         }
       });

       if (error) throw error;

       toast({
         title: "Tehtävä tallennettu",
         description: "Sisältö on tallennettu tehtävään onnistuneesti.",
       });

       setIsSaved(true);

       // Callback
       if (onSaved) {
         onSaved();
       }
     } catch (error) {
       console.error("Error saving to task:", error);

       const errorMessage = error instanceof Error
         ? error.message
         : "Tuntematon virhe";

       toast({
         title: "Virhe tallennuksessa",
         description: `Tehtävän tallentaminen epäonnistui: ${errorMessage}`,
         variant: "destructive"
       });
     } finally {
       setIsSaving(false);
     }
   };

   // Muut funktiot pysyvät samoina
   const formatSelection = (format: string) => {
     document.execCommand(format);
     if (editorRef.current) editorRef.current.focus();
   };

   const addHeading = (level: number) => {
     document.execCommand('formatBlock', false, `h${level}`);
     if (editorRef.current) editorRef.current.focus();
   };

   const addLink = () => {
     const url = prompt('Syötä linkin URL-osoite:', 'https://');
     if (url) {
       document.execCommand('createLink', false, url);
     }
     if (editorRef.current) editorRef.current.focus();
   };

   // Optimoitu handleEditorChange - ei sanitoi joka keystrokella
   const handleEditorChange = () => {
     if (isSaved) setIsSaved(false);

     if (editorRef.current) {
       // Tallenna sisältö sellaisenaan (nopea operaatio)
       const content = editorRef.current.innerHTML;
       setEditorContent(content);
       
       // Päivitä hasContent-tila
       setHasContent(!!editorRef.current.textContent?.trim());
       
       // Käynnistä debounced sanitointi - suoritetaan vain kun käyttäjä pysähtyy
       debouncedSanitize(content);
     }
   };

   // "Jaa AI:n kanssa" -napin käsittelijä - KORJATTU
   const handleShareWithAI = () => {
     if (editorRef.current) {
       try {
         console.log("Jakaminen aloitettu");

         // 1. Muunna HTML puhtaaksi tekstiksi
         const plainText = htmlToPlainText(editorRef.current.innerHTML);

         // 2. Lisää johdanto tekstiin
         const formattedText = `Tässä työstämäni tehtävän sisältö. Auta minua parantamaan 
 sitä:\n\n${plainText}`;

         console.log("Tekstimuodossa lähetettävä viesti:", formattedText.substring(0, 100) + "...");

         // 3. Lähetä viesti - onContentShare on funktio ChatContainer.tsx:ssä, joka kutsuu
         // AIAssistant.tsx:n handleSendMessageWithContent-funktiota
         onContentShare(formattedText);

         // 4. Sulje editori
         onClose();

         toast({
           title: "Sisältö jaettu",
           description: "Tehtävän sisältö on jaettu AI:n kanssa",
         });
       } catch (error) {
         console.error("Virhe sisällön jakamisessa:", error);
         toast({
           title: "Virhe sisällön jakamisessa",
           description: "Sisällön jakaminen AI:n kanssa epäonnistui",
           variant: "destructive"
         });
       }
     }
   };

   if (!isOpen) return null;

   return (
     <>
       <div className="fixed inset-y-0 right-0 w-[450px] border-l bg-background flex flex-col z-20 shadow-xl">
         {/* Header */}
         <div className="p-4 border-b flex justify-between items-center bg-white">
           <div className="flex items-center gap-2">
             <h3 className="font-medium text-sm">Tehtäväeditori</h3>
             <Badge variant="outline">{taskContext.taskTitle}</Badge>
           </div>
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={onClose}
             className="h-8 w-8 p-0"
           >
             <X className="h-4 w-4" />
             <span className="sr-only">Sulje</span>
           </Button>
         </div>

         {/* Toimintopainikkeet */}
         <div className="px-4 py-2 border-b bg-white">
           <div className="flex justify-between items-center">
             <div className="flex flex-wrap gap-1">
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-8 w-8 p-0" 
                 onClick={() => formatSelection('bold')}
                 title="Lihavointi"
               >
                 <Bold className="h-4 w-4" />
               </Button>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-8 w-8 p-0" 
                 onClick={() => formatSelection('italic')}
                 title="Kursivointi"
               >
                 <Italic className="h-4 w-4" />
               </Button>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-8 w-8 p-0" 
                 onClick={() => formatSelection('insertUnorderedList')}
                 title="Lista"
               >
                 <List className="h-4 w-4" />
               </Button>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-8 w-8 p-0" 
                 onClick={() => formatSelection('insertOrderedList')}
                 title="Numeroitu lista"
               >
                 <ListOrdered className="h-4 w-4" />
               </Button>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-8 w-8 p-0" 
                 onClick={() => addHeading(2)}
                 title="Otsikko"
               >
                 <Heading className="h-4 w-4" />
               </Button>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-8 w-8 p-0" 
                 onClick={addLink}
                 title="Lisää linkki"
               >
                 <Link className="h-4 w-4" />
               </Button>
             </div>

             <div className="flex gap-2">
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={handleShareWithAI}
                 disabled={!hasContent}
                 className="gap-1"
               >
                 <MessageSquare className="h-3.5 w-3.5" />
                 <span>Jaa AI:n kanssa</span>
               </Button>

               <Button 
                 variant={isSaved ? "outline" : "default"}
                 size="sm"
                 onClick={() => setShowConfirmDialog(true)}
                 disabled={isSaving || isSaved || !hasContent}
                 className="gap-1"
               >
                 {isSaving ? (
                   <>
                     <Loader2 className="h-3.5 w-3.5 animate-spin" />
                     <span>Tallennetaan...</span>
                   </>
                 ) : isSaved ? (
                   <>
                     <Check className="h-3.5 w-3.5 text-green-600" />
                     <span>Tallennettu</span>
                   </>
                 ) : (
                   <>
                     <Save className="h-3.5 w-3.5" />
                     <span>Tallenna</span>
                   </>
                 )}
               </Button>
             </div>
           </div>
         </div>

         {/* WYSIWYG Editor */}
         <div className="flex-1 overflow-y-auto p-4">
           <div
             ref={editorRef}
             contentEditable
             className="border rounded p-3 min-h-[calc(100vh-200px)] prose prose-sm max-w-none 
 focus:outline-none focus:ring-1 focus:ring-primary"
             onInput={handleEditorChange}
           />
         </div>

         {/* Footer */}
         <div className="p-3 border-t">
           <p className="text-xs text-muted-foreground">
             Käytä työkalupalkin painikkeita tekstin muotoiluun. Jaa sisältö AI:n kanssa saadaksesi apua tai
 tallenna tehtävään kun olet valmis.
           </p>
         </div>
       </div>

       {/* Varmistusdialogi */}
       <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>Vahvista tehtävän tallennus</DialogTitle>
             <DialogDescription>
               Olet tallentamassa sisältöä tehtävään. Tämä merkitsee tehtävän valmiiksi.
             </DialogDescription>
           </DialogHeader>

           <Alert className="my-2">
             <AlertDescription className="text-sm">
               Tallentamalla tämän sisällön, tehtävä merkitään valmiiksi. Oletko varma?
             </AlertDescription>
           </Alert>

           <DialogFooter>
             <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Peruuta</Button>
             <Button onClick={saveToTask} disabled={isSaving}>
               {isSaving ? "Tallennetaan..." : "Tallenna ja merkitse valmiiksi"}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </>
   );
 };

 export default TaskWYSIWYGEditor;