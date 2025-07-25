
/**
 * MIETITTÄVÄ TOTEUTUS UUSIKSI
 * 
 * Tämä komponentti käyttää vanhentunutta chat-assistant Supabase-funktiota, joka ei ole aktiivisessa käytössä.
 * Lisäksi komponentissa on syntaksivirhe import-lausekkeessa handleSendMessage-funktion sisällä.
 * 
 * Komponentti tulisi päivittää käyttämään ai-database-chat -funktiota, joka on nykyinen ja toimiva toteutus,
 * tai mahdollisesti yhdistää tämä toiminnallisuus AIAssistant.tsx -komponentin kanssa päällekkäisyyksien välttämiseksi.
 */

import React, { useState } from "react";
import { Bot, X, Mic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const AIAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    {role: "assistant", content: "Hei! Olen älykkäs Myyntikuntoon-assistentti. Voin auttaa sinua yrityksesi myyntikunnon arvioinnissa ja antaa neuvoja myyntiin liittyvissä asioissa. Miten voin auttaa sinua tänään?"}
  ]);
  const { user } = useAuth();
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const newMessage = { role: "user", content: message };
    setMessages(prev => [...prev, newMessage]);
    
    // Clear input
    setMessage("");
    
    try {
      setIsLoading(true);
      
      // Get company information from user context
      const companyName = user?.user_metadata?.company || "";
      const companyData = {
        industry: user?.user_metadata?.industry || "",
        founded: user?.user_metadata?.founded || "",
        employees: user?.user_metadata?.employees || "",
        revenue: user?.user_metadata?.revenue || ""
      };
      
      // Prepare message history
      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Käytä callEdgeFunction-apufunktiota suoran fetching sijaan
      const { callEdgeFunction } = await import("@/utils/edge-function");
      
      const { data, error } = await callEdgeFunction('chat-assistant', {
        message: message,
        companyName,
        companyData,
        messageHistory
      });
      
      if (error) {
        throw error;
      }
      
      // Add assistant response to chat
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.response || "Kiitos viestistäsi. Miten voin auttaa sinua yrityksesi myyntikuntoon liittyvissä asioissa?" 
      }]);
      
      // Play audio if available
      if (data.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audio.play();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Pahoittelen, mutta en pystynyt käsittelemään viestiäsi. Kokeile myöhemmin uudelleen." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <Card className="w-80 sm:w-96 h-96 mb-2 shadow-neumorphic bg-secondary/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm flex items-center text-foreground">
                <Bot className="h-4 w-4 mr-2" />
                Myyntikunto AI Avustaja
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={toggleChat}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 overflow-y-auto h-64">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground mt-10">
                  <Bot className="h-12 w-12 mx-auto mb-2 text-primary" />
                  <p>Kysy minulta mitä tahansa yrityksesi myyntikuntoon liittyen.</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "p-3 rounded-2xl max-w-[80%]", 
                      msg.role === "user" 
                        ? "bg-primary/10 ml-auto shadow-neumorphic-inset" 
                        : "bg-secondary shadow-neumorphic-inset"
                    )}
                  >
                    {msg.content}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="bg-secondary shadow-neumorphic-inset p-3 rounded-2xl max-w-[80%]">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150"></div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <div className="flex gap-2 w-full items-end">
              <Button 
                variant="ghost" 
                size="icon" 
                className="flex-shrink-0 hover:shadow-neumorphic"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Textarea 
                placeholder="Kirjoita viestisi..." 
                className="min-h-10 resize-none flex-1 shadow-neumorphic-inset bg-secondary/50"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="flex-shrink-0 bg-primary/10 hover:bg-primary/20 shadow-neumorphic hover:shadow-neumorphic"
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
      
      <Button
        onClick={toggleChat}
        variant="default"
        size="icon"
        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-14 w-14 shadow-neumorphic ai-assistant-toggle"
      >
        <Bot className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default AIAssistantWidget;
