// src/pages/AIAssistant.tsx
import React, { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useCompany } from "@/hooks/use-company";
import { Message, CompanyContext, DocumentGeneration } from "@/components/chat/types";
import ChatContainer from "@/components/chat/ChatContainer";
import { useFileUpload } from "@/hooks/useFileUpload";
// Tiedostokonstantit
import { ACCEPTED_FILE_FORMATS, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@/constants/fileTypes";

const AIAssistant = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(
    searchParams.get("conversationId")
  );
  const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);
  const { activeCompany } = useCompany();
  const [companyContext, setCompanyContext] = useState<CompanyContext | null>(null);
  const [hasShownInitialToast, setHasShownInitialToast] = useState(false);

  // Tiedostojen käsittely - käytetään vakioita
  const {
    file: uploadedFile,
    fileContent,
    fileType,
    isLoading: isFileLoading,
    fileInputRef,
    handleFileChange,
    clearFile: removeUploadedFile,
    triggerFileUpload
  } = useFileUpload({
    maxSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_FILE_TYPES
  });

  const [documentGenerationReady, setDocumentGenerationReady] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<DocumentGeneration | null>(null);
  const collectedUserDataRef = useRef<any>({});


  // Ladataan yritystieto kun komponentti mountataan
  useEffect(() => {
    if (activeCompany && !isLoadingContext && !companyContext) {
      loadCompanyContext();
    }
  }, [activeCompany, isLoadingContext, companyContext]);

  // Hakee kaikki käyttäjän yritykset
  useEffect(() => {
    if (user) {
      const fetchCompanies = async () => {
        try {
          const { data, error } = await supabase
            .from("companies")
            .select("id, name")
            .eq("user_id", user.id);

          if (error) throw error;
          if (data) setCompanies(data);
        } catch (error) {
          console.error("Virhe yritysten hakemisessa:", error);
        }
      };

      fetchCompanies();
    }
  }, [user]);


  // Määritetään dokumentin generointi valmius
  useEffect(() => {
    const hasEnoughData = () => {
      // Dokumenttigenerointi näytetään kun on vähintään 2 käyttäjän viestiä
      const userMessageCount = messages.filter(m => m.role === "user").length;
      return userMessageCount >= 2;
    };

    setDocumentGenerationReady(hasEnoughData());
  }, [messages, fileContent]);

  const loadCompanyContext = async () => {
    if (!activeCompany || !user || isLoadingContext) return;

    try {
      setIsLoadingContext(true);

      const companyData = {
        id: activeCompany.id,
        name: activeCompany.name,
        business_id: activeCompany.business_id,
        industry: activeCompany.industry,
        founded: activeCompany.founded,
        employees: activeCompany.employees,
        website: activeCompany.website,
        company_type: activeCompany.company_type,
        ownership_change_type: activeCompany.ownership_change_type,
        valuation: activeCompany.valuation
      };

      const { data: companyInfo, error: infoError } = await supabase
        .from("company_info")
        .select("*")
        .eq("company_id", activeCompany.id)
        .maybeSingle();

      if (infoError) {
        console.error("Virhe yritystietojen hakemisessa:", infoError);
      }


      const { data: valuation, error: valuationError } = await supabase
        .from("valuations")
        .select("*")
        .eq("company_id", activeCompany.id)
        .limit(1)
        .maybeSingle();

      if (valuationError) {
        console.error("Virhe arvonmäärityksen hakemisessa:", valuationError);
      } 

      setCompanyContext({
        companyData,
        companyInfo,
        valuation,
        lastUpdated: new Date()
      });

      if (!hasShownInitialToast || isLoadingContext) {
        toast({
          title: "Yritystiedot ladattu",
          description: "AI-asiantuntija on nyt valmiina auttamaan sinua yrityksesi tietoihin perustuen.",
          duration: 3000,
        });
        setHasShownInitialToast(true);
      }
    } catch (error) {
      console.error("Virhe yritystietojen lataamisessa:", error);
      toast({
        title: "Virhe tietojen lataamisessa",
        description: "Yritystietojen lataus epäonnistui. Yritä myöhemmin uudelleen.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingContext(false);
    }
  };

  // AI-avustajan kommunikaatiorajapinta
  const handleHandlerAction = async (action: string, data?: any) => {
    console.log(`AI Action Handler: ${action}`, data);

    if (action === 'documentDownloaded') {
      const format = data?.format || 'markdown';
      // Tiedoston lataaminen hoidetaan jo DocumentHandlerContainer-komponentissa,
      // joten tässä ei tarvitse tehdä mitään
    }
  };

  const handleSendMessage = async (e: React.FormEvent, contentOverride?: string) => {
    e.preventDefault();

    // Käytä contentOverride-parametria jos annettu, muuten käytä message-tilaa
    const contentToSend = contentOverride || message;

    if (!contentToSend.trim() && !uploadedFile) {
      setMessage("");
      return;
    }

    if (isLoading) return;

    try {
      await handleSendMessageWithContent(contentToSend);
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
    }
  };

  const handleSendMessageWithContent = async (messageContent: string) => {
    if (isLoading) return;

    if (!companyContext) {
      toast({
        title: "Yritystiedot puuttuvat",
        description: "Lataa ensin yrityksen tiedot tekoälylle käyttöön.",
        variant: "destructive",
      });
      return;
    }

    const userMessageContent = messageContent.trim() + (uploadedFile 
      ? `\n\nLisätty tiedosto: ${uploadedFile.name}` 
      : "");

    try {
      const userMessage = { role: "user" as const, content: userMessageContent || "Moi" };

      // Lisää viesti aina, mutta vain kerran
      setMessages((prev) => {
        const isMessageAlreadyAdded = prev.some(m => m.role === "user" && m.content === userMessageContent);
        if (!isMessageAlreadyAdded) {
          return [...prev, userMessage];
        }
        return prev;
      });

      setMessage("");
      setIsLoading(true);

      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Käytä tiedoston sisältöä sellaisenaan
      let truncatedFileContent = fileContent;

      const { data, error } = await supabase.functions.invoke("ai-database-chat", {
        body: {
          message: messageContent.trim(),
          messageHistory: messageHistory,
          userId: user?.id,
          fileContent: truncatedFileContent,
          fileName: uploadedFile?.name,
          fileType: fileType,
          companyContext: companyContext
        }
      });

      removeUploadedFile();

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(`Virhe AI-funktiossa: ${error.message}`);
      }

      if (!data) {
        throw new Error("AI ei palauttanut vastausta");
      }

      const aiResponse = data.response || "Pahoittelut, en pystynyt vastaamaan kyselyyn tällä hetkellä. Yritäthän hetken kuluttua uudelleen.";

      const sources = Array.isArray(data.groundingSources) 
        ? data.groundingSources.map((source: any) => ({
            title: source.title || "Tuntematon lähde",
            url: source.url || "#"
          }))
        : undefined;

      // Haetaan aina uusimmat viestit tilamuuttujasta
      setMessages((prevMessages) => {
        const updatedMessages = [
          ...prevMessages,
          { 
            role: "assistant", 
            content: aiResponse,
            sources: sources
          }
        ];
        return updatedMessages;
      });

      // Tallenna keskustelu automaattisesti Supabaseen
      const autoSaveConversation = async () => {
        try {
          // Haetaan ajantasaiset viestit messages-tilamuuttujasta
          const updatedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp || new Date().toISOString(),
            sources: msg.sources
          }));

          // Lisätään uusi käyttäjän viesti, jos sitä ei vielä ole
          if (!updatedMessages.some(m => m.role === "user" && m.content === userMessage.content)) {
            updatedMessages.push({
              role: "user", 
              content: userMessage.content,
              timestamp: new Date().toISOString()
            });
          }

          // Lisätään uusi AI:n vastaus, jos sitä ei vielä ole
          if (!updatedMessages.some(m => m.role === "assistant" && m.content === aiResponse)) {
            updatedMessages.push({
              role: "assistant", 
              content: aiResponse,
              timestamp: new Date().toISOString(),
              sources: sources
            });
          }

          // Käytetään tilamuuttujaa conversationId:tä
          const title = updatedMessages.length > 0 
            ? updatedMessages[0].content.substring(0, 50) + (updatedMessages[0].content.length > 50 ? "..." : "") 
            : userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? "..." : "");

          console.log("Tallennetaan keskustelu ID:", conversationId || "uusi keskustelu");
          console.log("Viestien määrä:", updatedMessages.length);

          const { data, error } = await supabase.functions.invoke("save-conversation", {
            body: {
              conversation_id: conversationId, // Käytä tilamuuttujaa URL:n sijaan
              title: title,
              messages: updatedMessages,
              is_saved: false, // Automaattisesti tallennetut eivät ole "pinnattuja"
              company_id: companyContext?.companyData?.id
            }
          });

          if (error) {
            console.error("Virhe automaattisessa tallennuksessa:", error);
          } else {
            console.log("Keskustelu tallennettu automaattisesti:", data);

            // Jos meillä ei ollut conversationId:tä ja saimme uuden keskustelun luotua,
            // tallennetaan se tilamuuttujaan ja päivitetään URL
            if (!conversationId && data?.data?.id) {
              setConversationId(data.data.id); // Tämä on oleellinen muutos

              const url = new URL(window.location.href);
              url.searchParams.set("conversationId", data.data.id);
              window.history.replaceState({}, '', url.toString());
            }
          }
        } catch (err) {
          console.error("Virhe automaattisessa tallennuksessa:", err);
        }
      };

      // Suorita automaattinen tallennus taustataskina
      // Ei käytetä await jotta käyttäjäkokemus pysyy nopeana
      // Virheet käsitellään funktion sisällä
      autoSaveConversation().catch(err => {
        console.error("Automaattinen tallennus epäonnistui:", err);
      });

      // Kerää käyttäjän tiedot mahdollista dokumenttigenerointia varten
      collectedUserDataRef.current = {
        messages: messages.concat([userMessage, { role: "assistant", content: aiResponse }]),
        fileContents: fileContent ? [{ name: uploadedFile?.name, content: fileContent, type: fileType }] : []
      };
    } catch (error) {
      console.error("Error sending message:", error);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Pahoittelut, tekoälyassistentin käytössä ilmeni tekninen ongelma. Yritäthän hetken kuluttua uudelleen." }
      ]);

      toast({
        title: "Virhe viestin lähettämisessä",
        description: error instanceof Error ? error.message : "Jotain meni pieleen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDocument = async () => {
    try {
      setIsLoading(true);

      // Kerää käyttäjän tiedot keskustelusta
      const userInputData = {
        messages: messages.map(m => m.content),
        fileContents: fileContent ? [{ name: uploadedFile?.name, content: fileContent, type: fileType }] : []
      };

      // Kutsu dokumenttigenerointifunktiota
      const { data, error } = await supabase.functions.invoke("ai-document-generator", {
        body: {
          format: "markdown",
          userData: userInputData
        }
      });

      if (error) throw error;

      if (!data || !data.content) {
        throw new Error("Dokumentin generointi epäonnistui: Ei sisältöä");
      }

      setGeneratedDocument({
        content: data.content,
        format: data.format
      });

      // Lisää vastaus keskusteluun
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Olen luonut dokumentin pyytämiesi tietojen perusteella. Voit ladata sen eri muodoissa.`
        }
      ]);

      toast({
        title: "Dokumentti luotu",
        description: "Dokumentti on luotu onnistuneesti.",
      });

    } catch (error) {
      console.error("Error generating document:", error);
      toast({
        title: "Dokumentin luonti epäonnistui",
        description: error instanceof Error ? error.message : "Tuntematon virhe",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormatSelect = async (format: string) => {
    if (!generatedDocument) return;

    try {
      setIsLoading(true);
        // Muunna ja lataa dokumentti
        let downloadContent = generatedDocument.content;
        let mimeType = "text/plain";
        let filename = `dokumentti-${Date.now()}`;

        if (format === "html") {
          // Yksinkertainen markdown → HTML muunnos
          const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Generoitu dokumentti</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #2563eb; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    th { background-color: #f1f5f9; }
    code { background-color: #f1f5f9; padding: 2px 4px; border-radius: 3px; }
  </style>
</head>
<body>
  <div id="content">
    ${downloadContent.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}
  </div>
</body>
</html>`;

          downloadContent = htmlContent;
          mimeType = "text/html";
          filename += ".html";
        } else if (format === "docx") {
          mimeType = "text/plain";
          filename += ".docx";
        } else {
          filename += ".md";
        }

        // Luo ladattava tiedosto
        const blob = new Blob([downloadContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Dokumentti ladattu",
          description: `Dokumentti ladattu ${format.toUpperCase()}-muodossa`,
        });
    } catch (error) {
      console.error("Error with document:", error);
      toast({
        title: "Virhe dokumentin käsittelyssä",
        description: error instanceof Error ? error.message : "Tuntematon virhe",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tyhjennä keskustelu
  const handleClearChat = () => {
    if (window.confirm("Haluatko varmasti tyhjentää nykyisen keskustelun?")) {
      setMessages([]);
      setGeneratedDocument(null);
    }
  };

  // Vaihda yritystä
  const handleCompanyChange = async (companyId: string) => {
    if (companyId !== activeCompany?.id) {
      // TODO: Tähän tarvitaan laajempi toteutus, joka käyttää useCompany-hookia
      toast({
        title: "Yrityksen vaihto",
        description: "Tämä toiminto vaatii lisätoteutusta.",
      });
    }
  };

  const hasMessages = messages.length > 0 || isLoading;

  return (
    <DashboardLayout pageTitle="" pageDescription="">
      {/* Chat-käyttöliittymä */}
      <ChatContainer 
        messages={messages}
        isLoading={isLoading}
        companyContext={companyContext}
        taskContext={null}
        isLoadingContext={isLoadingContext}
        documentGenerationReady={documentGenerationReady}
        generatedDocument={generatedDocument}
        message={message}
        uploadedFile={uploadedFile}
        fileContent={fileContent}
        onMessageChange={setMessage}
        onSendMessage={handleSendMessage}
        onFileUpload={triggerFileUpload}
        onRemoveFile={removeUploadedFile}
        onLoadCompanyContext={loadCompanyContext}
        onGenerateDocument={handleGenerateDocument}
        onFormatSelect={handleFormatSelect}
        onClearChat={handleClearChat}
        hasMessages={hasMessages}
        companies={companies}
        onCompanyChange={handleCompanyChange}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
        acceptedFileFormats={ACCEPTED_FILE_FORMATS}
        onHandlerAction={handleHandlerAction}
      />
    </DashboardLayout>
  );
};

export default AIAssistant;