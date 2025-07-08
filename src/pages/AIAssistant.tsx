import React, { useState, useRef, useEffect } from "react";
import { Bot, ExternalLink, SendHorizontal, User, HelpCircle, FileText, X, Upload, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCompany } from "@/hooks/use-company";
import { useCompanyTasks } from "@/hooks/use-company-tasks";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: {
    title: string;
    url: string;
  }[];
}

interface CompanyContext {
  companyData: any;
  companyInfo?: any;
  tasks?: any[];
  valuation?: any;
  lastUpdated: Date;
}

const AIAssistant = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get("taskId");
  const taskTitle = searchParams.get("taskTitle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const { activeCompany } = useCompany();
  const { fetchTasks } = useCompanyTasks();
  const [companyContext, setCompanyContext] = useState<CompanyContext | null>(null);
  const [hasShownInitialToast, setHasShownInitialToast] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeCompany && !isLoadingContext && !companyContext) {
      loadCompanyContext();
    }
  }, [activeCompany, isLoadingContext, companyContext]);

  useEffect(() => {
    if (taskId && taskTitle && companyContext && messages.length === 0) {
      const initialMessage = `Auta minua seuraavassa tehtävässä: "${taskTitle}" (tehtävä ID: ${taskId})`;
      setMessages([
        { 
          role: "user", 
          content: initialMessage
        }
      ]);
      handleSendMessageWithContent(initialMessage);
    }
  }, [taskId, taskTitle, companyContext]);

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
      
      let tasks = [];
      try {
        tasks = await fetchTasks(activeCompany.id);
      } catch (error) {
        console.error("Virhe tehtävien hakemisessa:", error);
      }
      
      const { data: valuation, error: valuationError } = await supabase
        .from("valuations")
        .select("*")
        .eq("company_id", activeCompany.id)
        .limit(1)
        .maybeSingle();
        
      if (valuationError) {
        console.error("Virhe arvonmäärityksen hakemisessa:", valuationError);
      } else if (valuation) {
        console.log("Löydettiin arvonmääritys:", valuation);
      } else {
        console.log("Arvonmääritystä ei löytynyt tälle yritykselle");
      }
      
      setCompanyContext({
        companyData,
        companyInfo,
        tasks,
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Tiedosto on liian suuri",
          description: "Maksimikoko on 5MB",
          variant: "destructive",
        });
        return;
      }

      const validTypes = [
        'text/plain', 'text/csv', 'application/json', 'text/html',
        'text/javascript', 'text/typescript', 'text/markdown', 'text/css',
        'application/xml'
      ];
      
      if (!validTypes.includes(file.type) && !file.type.startsWith('text/')) {
        toast({
          title: "Tiedostotyyppi ei ole tuettu",
          description: "Käytä tekstitiedostoja kuten .txt, .csv, .json",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);
      };
      reader.onerror = () => {
        toast({
          title: "Tiedoston lukeminen epäonnistui",
          description: "Yritä uudelleen toisella tiedostolla",
          variant: "destructive",
        });
      };
      
      if (file.type === "application/pdf") {
        toast({
          title: "PDF-tiedostot eivät ole tuettuja",
          description: "Käytä tekstimuotoisia tiedostoja kuten .txt tai .csv",
          variant: "destructive",
        });
        return;
      } else {
        reader.readAsText(file);
      }
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setFileContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !uploadedFile) {
      setMessage("");
      return;
    }
    
    if (isLoading) return;
    
    try {
      await handleSendMessageWithContent(message);
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
      
      if (!messages.some(m => m.role === "user" && m.content === userMessageContent)) {
        setMessages((prev) => [...prev, userMessage]);
      }
      
      setMessage("");
      setIsLoading(true);

      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      console.log("Lähetetään viesti AI:lle:", messageContent);
      console.log("Viestihistorian pituus:", messageHistory.length);
      
      let truncatedFileContent = fileContent;
      if (truncatedFileContent && truncatedFileContent.length > 100000) {
        truncatedFileContent = truncatedFileContent.substring(0, 100000) + "... [content truncated due to size]";
      }

      const contextData: Record<string, any> = {};
      if (taskId) {
        contextData.taskId = taskId;
        contextData.taskTitle = taskTitle;
      }

      const { data, error } = await supabase.functions.invoke("ai-database-chat", {
        body: {
          message: messageContent.trim(),
          messageHistory: messageHistory,
          userId: user?.id,
          fileContent: truncatedFileContent,
          fileName: uploadedFile?.name,
          context: Object.keys(contextData).length > 0 ? contextData : undefined,
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

      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: aiResponse,
          sources: sources
        }
      ]);
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

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <DashboardLayout
      pageTitle="Kysy AI:lta"
      pageDescription="Kysy neuvoa yrityskauppoihin, arvonmääritykseen ja myyntikuntoon liittyvissä asioissa"
    >
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        <Card className="flex-grow overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-medium">AI-asiantuntija</h2>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={loadCompanyContext}
                      disabled={isLoadingContext || !activeCompany}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingContext ? 'animate-spin' : ''}`} />
                      {companyContext ? 'Päivitä tiedot' : 'Lataa tiedot'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {companyContext 
                      ? `Viimeksi päivitetty: ${companyContext.lastUpdated.toLocaleString()}` 
                      : 'Lataa yrityksen tiedot tekoälylle käyttöön'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {taskId && taskTitle && (
              <div className="mt-2 bg-muted p-2 rounded-md text-sm">
                <div className="flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                  <span>
                    Avustaja auttaa sinua tehtävässä: <strong>{taskTitle}</strong>
                  </span>
                </div>
              </div>
            )}
            {companyContext && (
              <div className="mt-2 bg-muted/50 p-2 rounded-md text-xs text-muted-foreground">
                <p>
                  AI-asiantuntijalla on käytössään tietoja yrityksestä {companyContext.companyData.name}.
                  {companyContext.lastUpdated && ` Tiedot päivitetty: ${companyContext.lastUpdated.toLocaleString()}`}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <Bot className="h-12 w-12 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Tervetuloa AI-asiantuntijan pariin</h3>
                <p>
                  Voit kysyä neuvoa yrityskauppoihin, arvonmääritykseen ja myyntikuntoon 
                  liittyvissä asioissa. Asiantuntija hyödyntää tietokannassa olevaa tietoa yrityksestäsi.
                </p>
                {!companyContext && activeCompany && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={loadCompanyContext}
                    disabled={isLoadingContext}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingContext ? 'animate-spin' : ''}`} />
                    Lataa yritystiedot
                  </Button>
                )}
                <p className="mt-4">
                  Voit myös ladata tiedostoja, joita AI käyttää vastausten muodostamisessa.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {msg.role === "assistant" ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">
                        {msg.role === "assistant" ? "AI-asiantuntija" : "Sinä"}
                      </span>
                    </div>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                    
                    {msg.role === "assistant" && msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs mb-1 text-muted-foreground">Lähteet:</p>
                        <div className="space-y-1">
                          {msg.sources.map((source, sourceIndex) => (
                            <a 
                              key={sourceIndex}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {source.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="h-4 w-4" />
                    <span className="text-sm font-medium">AI-asiantuntija</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t">
            {uploadedFile && (
              <div className="mb-2 p-2 bg-muted rounded-md flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm truncate max-w-[200px]">{uploadedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(uploadedFile.size / 1024)} KB
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={removeUploadedFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                type="text"
                placeholder="Kirjoita viestisi tähän..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading || !companyContext}
                className="flex-grow"
              />
              
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.csv,.json,.xml,.html,.js,.ts,.jsx,.tsx,.css,.md"
                style={{ display: 'none' }}
              />
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={triggerFileUpload}
                      disabled={isLoading || !!uploadedFile || !companyContext}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Lataa tiedosto (txt, csv, json)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button 
                type="submit" 
                disabled={isLoading || !companyContext}
              >
                <SendHorizontal className="h-4 w-4 mr-2" />
                Lähetä
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AIAssistant;

