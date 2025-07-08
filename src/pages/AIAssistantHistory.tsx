// src/pages/AIAssistantHistory.tsx
import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { FileStack, Info } from "lucide-react";
import ChatHistorySidebar from "@/components/chat/ChatHistorySidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MessageList from "@/components/chat/MessageList";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button"; 
import { MessageSquare } from "lucide-react"; 
import { callEdgeFunction } from "@/utils/edge-function";
import ProductTour from "@/components/ProductTour"; // Import the ProductTour component
import { Step } from "react-joyride"; // Import the Step type


// Keskustelun ja viestin tyypit
interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

const AIAssistantHistory = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const { toast } = useToast();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  //TÄSTÄ ALKAA PRODUCT TOUR TOTEUTUS
  
  // ProductTour state
  const [runTour, setRunTour] = useState<boolean>(false);

  // Define tour steps
  const tourSteps: Step[] = [
    {
      target: ".conversation-sidebar",
      content: "Näet kaikki aiemmat keskustelusi tässä sivupalkissa. Valitse keskustelu tarkastellaksesi sen sisältöä.",
      disableBeacon: true,
    },
    {
      target: ".conversation-content",
      content: "Valitun keskustelun sisältö näytetään tässä. Viestit on järjestetty aikajärjestyksessä.",
    },
    {
      target: ".new-conversation-button",
      content: "Tästä voit aloittaa uuden keskustelun.",
    },
    {
      target: ".show-saved-button",
      content: "Tästä voit näyttää vain tallentamasi keskustelut.",
    }
  ];

  // Check if this is user's first visit to this page and show tour automatically
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("conversationHistoryTourSeen");
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, []);

  // Handle tour completion
  const handleTourFinish = (): void => {
    localStorage.setItem("conversationHistoryTourSeen", "true");
    setRunTour(false);
  };

  //TÄHÄN LOPPUU PRODUCT TOUR TOTEUTUS
  
  // Resetoi scroll position aina kun komponentti latautuu
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, []);

  // Haetaan valitun keskustelun viestit get-conversation edge funktiolla
  useEffect(() => {
    const fetchConversationWithEdgeFunction = async () => {
      if (!selectedConversationId) {
        setConversationMessages([]);
        return;
      }

      setLoadingMessages(true);

      try {
        console.log("Haetaan keskustelua edge-funktiolla:", selectedConversationId);

        // Käytetään edge-funktiota hakemaan keskustelu ja sen viestit
        const { data, error } = await callEdgeFunction<{
          success: boolean;
          data: {
            id: string;
            title: string;
            messages: Array<{
              id: string;
              role: string;
              content: string;
              timestamp: string;
            }>;
            files?: Array<any>;
          };
        }>("get-conversation", {
          conversation_id: selectedConversationId
        });

        if (error) {
          console.error("Edge function error:", error);
          throw error;
        }

        if (data?.success && data.data?.messages) {
          // Muotoile viestit oikeaan muotoon
          const formattedMessages = data.data.messages.map(msg => ({
            id: msg.id || String(Math.random()),
            role: msg.role,
            content: msg.content,
            created_at: msg.timestamp
          }));

          console.log("Haetut viestit:", formattedMessages.length);
          setConversationMessages(formattedMessages);

          // Resetoi scrollaus ylös kun viestit latautuvat
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = 0;
            }
          }, 50);
        } else {
          console.error("Invalid response from edge function:", data);
          throw new Error("Virheellinen vastaus edge-funktiolta");
        }
      } catch (err) {
        console.error("Error fetching conversation with edge function:", err);
        toast({
          title: "Virhe",
          description: "Keskustelun hakeminen epäonnistui. Yritä uudelleen.",
          variant: "destructive",
        });
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchConversationWithEdgeFunction();
  }, [selectedConversationId, toast]);

  // Näytetään keskustelun sivupalkki ja valitun keskustelun sisältö
  return (
    <DashboardLayout 
      pageTitle="Keskusteluhistoria" 
      pageDescription="Aiemmat keskustelut AI-assistentin kanssa">
      {/* Add ProductTour component */}
      <ProductTour
        isRunning={runTour}
        onFinish={handleTourFinish}
        steps={tourSteps}
      />

      <div className="flex h-full">
        {/* Keskusteluhistoria sivupalkki */}
        <div className="w-1/3 h-full border-r conversation-sidebar">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="font-semibold">Keskustelut</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setRunTour(true)}
              className="flex items-center gap-1.5"
            >
              <Info className="h-4 w-4" />
              <span>Opastus</span>
            </Button>
          </div>
          <ChatHistorySidebar 
            onConversationSelect={(conversationId) => {
              setSelectedConversationId(conversationId);
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = 0;
              }
            }}
            selectedConversationId={selectedConversationId}
          />
        </div>

        {/* Keskustelun sisältö */}
        <div className="w-2/3 h-full overflow-auto bg-background conversation-content" ref={messagesContainerRef}>
          {!selectedConversationId ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
              <FileStack className="h-16 w-16 mb-6 opacity-20" />
              <h2 className="text-xl font-medium mb-2">Valitse keskustelu</h2>
              <p>Näet keskustelun sisällön valitsemalla keskustelun vasemmalta.</p>
            </div>
          ) : loadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-pulse">Ladataan keskustelua...</div>
            </div>
          ) : conversationMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
              <div className="flex flex-col items-center justify-center text-muted-foreground mb-4">
                <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
                <h3 className="text-xl font-medium mb-2">Ei viestejä</h3>
                <p className="mb-4">Tässä keskustelussa ei ole viestejä tai niitä ei voitu hakea.</p>
                <Button 
                  onClick={async () => {
                    setLoadingMessages(true);
                    try {
                      const { data, error } = await callEdgeFunction<{
                        success: boolean;
                        data: {
                          id: string;
                          title: string;
                          messages: Array<{
                            id: string;
                            role: string;
                            content: string;
                            timestamp: string;
                          }>;
                        };
                      }>("get-conversation", {
                        conversation_id: selectedConversationId
                      });

                      if (error) throw error;

                      if (data?.success && data.data?.messages) {
                        const formattedMessages = data.data.messages.map(msg => ({
                          id: msg.id || String(Math.random()),
                          role: msg.role,
                          content: msg.content,
                          created_at: msg.timestamp
                        }));

                        setConversationMessages(formattedMessages);
                      }
                    } catch (err) {
                      console.error("Error refetching messages:", err);
                      toast({
                        title: "Virhe",
                        description: "Keskustelun hakeminen epäonnistui. Yritä uudelleen.",
                        variant: "destructive",
                      });
                    } finally {
                      setLoadingMessages(false);
                    }
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Lataa uudelleen
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 h-full">
              <MessageList 
                messages={conversationMessages.map(msg => ({
                  role: msg.role as "user" | "assistant",
                  content: msg.content,
                  id: msg.id
                }))} 
                isLoading={false}
                hasCompanyContext={false}
                disableAutoScroll={true}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIAssistantHistory;