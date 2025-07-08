import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Bold, Italic, List, ListOrdered, Heading, Link } from "lucide-react";
import DOMPurify from "dompurify";

interface TextResponseProps {
  taskId: string;
  value?: { text?: string };
  onSave: (value: { text: string }) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  minHeight?: string;
  maxLength?: number;
  disabled?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

/**
 * Paranneltu tekstivastauskomponentti, joka tukee WYSIWYG-muotoilua
 */
const TextResponse: React.FC<TextResponseProps> = ({
  taskId,
  value = {},
  onSave,
  label = "Vastaus",
  placeholder = "Kirjoita vastauksesi tähän...",
  multiline = true,
  minHeight = "120px",
  maxLength,
  disabled = false,
  autoSave = false,
  autoSaveDelay = 1000,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Alusta editorin sisältö kun komponentti ladataan
  useEffect(() => {
    if (editorRef.current && value?.text) {
      editorRef.current.innerHTML = value.text;
      adjustEditorHeight(); // Säädä korkeus alustuksen jälkeen
    }
  }, [value?.text]);

  // Siivoa timeout unmountin yhteydessä
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  // Funktio editorin korkeuden säätämiseen
  const adjustEditorHeight = () => {
    if (editorRef.current) {
      // Resetoi korkeus ensin, jotta saamme oikean scrollHeight-arvon
      editorRef.current.style.height = minHeight;

      // Aseta korkeus scrollHeight-arvon perusteella, mutta vähintään minHeight
      const minHeightValue = parseInt(minHeight);
      const scrollHeight = editorRef.current.scrollHeight;

      if (!isNaN(minHeightValue) && scrollHeight > minHeightValue) {
        editorRef.current.style.height = `${scrollHeight}px`;
      }
    }
  };

  // Muotoilufunktiot
  const formatSelection = (format: string) => {
    document.execCommand(format);
    if (editorRef.current) editorRef.current.focus();
    handleEditorChange();
  };

  const addHeading = (level: number) => {
    document.execCommand('formatBlock', false, `h${level}`);
    if (editorRef.current) editorRef.current.focus();
    handleEditorChange();
  };

  const addLink = () => {
    const url = prompt('Syötä linkin URL-osoite:', 'https://');
    if (url) {
      document.execCommand('createLink', false, url);
    }
    if (editorRef.current) editorRef.current.focus();
    handleEditorChange();
  };

  // Käsittele muutokset editorissa
  const handleEditorChange = () => {
    setIsDirty(true);
    adjustEditorHeight(); // Säädä korkeus joka muutoksen jälkeen

    // Handle auto-save
    if (autoSave && editorRef.current) {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }

      const timeout = setTimeout(() => {
        handleSave();
      }, autoSaveDelay);

      setAutoSaveTimeout(timeout);
    }
  };

  // Tallenna vastaus
  const handleSave = async () => {
    if (!isDirty || !editorRef.current) return;

    setIsSaving(true);
    try {
      // Puhdistetaan HTML XSS-hyökkäyksiltä
      const sanitizedHtml = DOMPurify.sanitize(editorRef.current.innerHTML, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'],
        ALLOWED_ATTR: ['href', 'target', 'rel']
      });

      await onSave({ text: sanitizedHtml });
      setIsDirty(false);
    } catch (error) {
      console.error("Error saving rich text response:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Laske tekstin pituus ilman HTML-tageja
  const getTextContentLength = () => {
    if (!editorRef.current) return 0;
    return editorRef.current.textContent?.length || 0;
  };

  const isTextTooLong = maxLength ? getTextContentLength() > maxLength : false;

  // Käsittele keydown-tapahtuma, erityisesti Enter-painikkeen painallus
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Varattu tulevaa käyttöä varten, esim. Tab-näppäimen käsittely
    // Säädetään korkeus heti kun Enter-näppäintä on painettu
    if (e.key === 'Enter') {
      // Pieni viive, jotta DOM ehtii päivittyä
      setTimeout(adjustEditorHeight, 0);
    }
  };

  return (
    <div className="space-y-2 p-4 bg-white rounded-lg shadow-md">
      {label && (
        <Label htmlFor={`richtext-${taskId}`} className="text-sm font-medium">
          {label}
        </Label>
      )}

      {/* Muotoilupainikkeet */}
      <div className="flex flex-wrap gap-1 p-1 border-b bg-slate-50 rounded-t-md">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => formatSelection('bold')}
          title="Lihavointi"
          type="button"
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => formatSelection('italic')}
          title="Kursivointi"
          type="button"
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => formatSelection('insertUnorderedList')}
          title="Lista"
          type="button"
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => formatSelection('insertOrderedList')}
          title="Numeroitu lista"
          type="button"
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => addHeading(2)}
          title="Otsikko"
          type="button"
          disabled={disabled}
        >
          <Heading className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={addLink}
          title="Lisää linkki"
          type="button"
          disabled={disabled}
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      {/* WYSIWYG-editori */}
      <div
        ref={editorRef}
        id={`richtext-${taskId}`}
        contentEditable={!disabled}
        className={`border rounded-b-md p-3 focus:outline-none focus:ring-1 focus:ring-primary prose prose-sm max-w-none ${isTextTooLong ? "border-red-500 focus-visible:ring-red-500" : ""}`}
        style={{ minHeight, height: minHeight, transition: "height 0.1s" }}
        onInput={handleEditorChange}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ 
          __html: DOMPurify.sanitize(value?.text || placeholder, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'blockquote'],
            ALLOWED_ATTR: ['href', 'target', 'rel']
          })
        }}
      />

      {/* Merkkilaskuri */}
      {maxLength && (
        <div className={`text-xs text-right ${isTextTooLong ? "text-red-500" : "text-muted-foreground"}`}>
          {getTextContentLength()}/{maxLength} merkkiä
        </div>
      )}

      {/* Tallennus-painike */}
      {!autoSave && (
        <div className="flex space-x-2 mt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || disabled || !isDirty || isTextTooLong}
            className="text-white w-full sm:w-auto"
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Tallennetaan...
              </>
            ) : (
              "Tallenna vastaus"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TextResponse;