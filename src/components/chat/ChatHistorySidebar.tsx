
// src/components/chat/ChatHistorySidebar.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileStack, Calendar, Search, MessageSquare, Clock, ChevronRight, Trash2, PlusCircle, Pin, Star, StarOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import { callEdgeFunction } from "@/utils/edge-function";
import { useToast } from "@/hooks/use-toast";

// Keskustelun tyyppi
interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  is_saved: boolean;
  company_id?: string;
  task_id?: string;
  preview?: {
    role: string;
    content: string;
  };
  message_count?: number;
}

interface ChatHistorySidebarProps {
  onConversationSelect?: (conversationId: string) => void;
  selectedConversationId?: string | null;
}

const ChatHistorySidebar = ({ onConversationSelect, selectedConversationId }: ChatHistorySidebarProps = {}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Haetaan keskustelut Supabasesta list-conversations edge-funktiolla
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await callEdgeFunction<{
          success: boolean;
          data: Conversation[];
          count: number;
        }>("list-conversations", {
          user_id: user.id,
          limit: 50,  // Haetaan 50 viimeisintä keskustelua
          offset: 0
        });
        
        if (error) throw error;
        
        if (data && data.data) {
          // Muunnetaan data sopivaan muotoon
          const formattedConversations = data.data.map(conv => ({
            ...conv,
            message_count: conv.preview ? 1 : 0, // Tämä on arvio, todellista viestihistoriaa ei palauteta listaus-endpointista
          }));
          
          setConversations(formattedConversations);
        } else {
          setConversations([]);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError("Keskustelujen hakeminen epäonnistui.");
        toast({
          title: "Virhe",
          description: "Keskustelujen hakeminen epäonnistui.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, [user, toast]);

  // Suodata keskustelut hakutermin ja tallennettujen perusteella
  const filteredConversations = conversations
    .filter(conv => {
      // Näytä vain tallennetut jos suodatin on päällä
      if (showPinnedOnly && !conv.is_saved) return false;
      // Suodata hakutermin perusteella
      return conv.title.toLowerCase().includes(searchTerm.toLowerCase());
    })
    // Järjestä ensin tallennetut, sitten aikajärjestyksessä
    .sort((a, b) => {
      // Tallennetut ensin
      if (a.is_saved && !b.is_saved) return -1;
      if (!a.is_saved && b.is_saved) return 1;
      // Sitten aikajärjestyksessä, uusin ensin
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

  // Käsittele keskustelun valinta
  const handleConversationClick = (conversationId: string) => {
    if (onConversationSelect) {
      // Jos callback on annettu, käytä sitä
      onConversationSelect(conversationId);
    } else {
      // Muuten navigoi chat-sivulle
      navigate(`/ai-assistant?conversationId=${conversationId}`);
    }
  };

  // Aloita uusi keskustelu
  const handleNewConversation = () => {
    navigate("/ai-assistant");
  };
  
  // Poista keskustelu
  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Estä navigointi klikattaessa poista-nappia
    
    if (!confirm("Haluatko varmasti poistaa tämän keskustelun? HUOM! Poistettua keskustelua ei saa enää palautettua.")) {
      return;
    }
    
    try {
      // Todellinen poistologiikka
      const { error } = await supabase
        .from("ai_conversations")
        .delete()
        .eq("id", conversationId);
        
      if (error) throw error;
      
      // Poista keskustelu paikallisesta tilasta
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      toast({
        title: "Keskustelu poistettu",
        description: "Keskustelu on poistettu onnistuneesti.",
      });
    } catch (err) {
      console.error("Error deleting conversation:", err);
      toast({
        title: "Virhe",
        description: "Keskustelun poistaminen epäonnistui.",
        variant: "destructive",
      });
    }
  };

  // Tallenna/poista tallennus keskustelusta
  const handleTogglePin = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Estä navigointi klikattaessa tallenna-nappia
    
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    const newSavedState = !conversation.is_saved;
    
    try {
      // Päivitä tallennus-tila Supabaseen
      const { error } = await supabase
        .from("ai_conversations")
        .update({ is_saved: newSavedState })
        .eq("id", conversationId);
        
      if (error) throw error;
      
      // Päivitä paikallinen tila
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? {...conv, is_saved: newSavedState} 
          : conv
      ));
      
      toast({
        title: newSavedState ? "Keskustelu tallennettu" : "Keskustelun tallennus poistettu",
        description: newSavedState 
          ? "Keskustelu on nyt tallennettu." 
          : "Keskustelu ei ole enää tallennettu.",
      });
    } catch (err) {
      console.error("Error updating saved status:", err);
      toast({
        title: "Virhe",
        description: "Keskustelun tallennustilan päivitys epäonnistui.",
        variant: "destructive",
      });
    }
  };

  // Formaatoi päivämäärä tai näytä "Tänään" jos tänään
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return `Tänään ${format(date, 'HH:mm', { locale: fi })}`;
    }
    
    return format(date, 'dd.MM.yyyy', { locale: fi });
  };

  return (
    <div className="flex flex-col h-full border-r bg-background">
      {/* Otsikko ja uusi keskustelu -painike */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FileStack className="mr-2 h-5 w-5 text-primary" />
            Keskusteluhistoria
          </h2>
          <Button 
            onClick={handleNewConversation}
            variant="outline" 
            size="sm"
            className="flex items-center gap-1 new-conversation-button"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Uusi keskustelu</span>
          </Button>
        </div>
          
          {/* Pinnaus-suodatin */}
          <div className="flex items-center">
            <Button
              variant={showPinnedOnly ? "secondary" : "ghost"}
              size="sm"
              className="flex items-center gap-1.5 text-sm show-saved-button"
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            >
              <Star className="h-3.5 w-3.5" />
              <span>{showPinnedOnly ? "Näytä kaikki" : "Näytä tallennetut"}</span>
            </Button>
          </div>
        </div>
      
      {/* Keskustelujen lista */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="animate-pulse">Ladataan keskusteluja...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 mb-4 text-destructive opacity-70" />
            <p>{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Yritä uudelleen
            </Button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
            {searchTerm ? (
              <>
                <Search className="h-10 w-10 mb-4 opacity-20" />
                <p>Ei hakutermiin "{searchTerm}" vastaavia keskusteluja</p>
              </>
            ) : showPinnedOnly ? (
              <>
                <Star className="h-10 w-10 mb-4 opacity-20" />
                <p>Ei tallennettuja keskusteluja</p>
                <Button 
                  variant="link" 
                  onClick={() => setShowPinnedOnly(false)}
                  className="mt-2"
                >
                  Näytä kaikki keskustelut
                </Button>
              </>
            ) : (
              <>
                <MessageSquare className="h-10 w-10 mb-4 opacity-20" />
                <p>Ei aiempia keskusteluja</p>
                <Button 
                  variant="link" 
                  onClick={handleNewConversation}
                  className="mt-2"
                >
                  Aloita ensimmäinen keskustelu
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <div 
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                  conversation.is_saved ? 'bg-muted/40' : ''
                } ${
                  selectedConversationId === conversation.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      {conversation.is_saved && (
                        <Star className="h-3.5 w-3.5 mr-1.5 text-primary fill-primary" />
                      )}
                      <h3 className="font-medium truncate">{conversation.title}</h3>
                    </div>
                    {conversation.preview && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {conversation.preview.role === 'assistant' ? 'AI: ' : 'Sinä: '}
                        {conversation.preview.content}
                      </p>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDate(conversation.last_message_at || conversation.created_at)}</span>
                      {conversation.company_id && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Yritys</span>
                        </>
                      )}
                      {conversation.task_id && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Tehtävä</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${conversation.is_saved ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                      onClick={(e) => handleTogglePin(e, conversation.id)}
                      title={conversation.is_saved ? 'Poista tallennus' : 'Tallenna keskustelu'}
                    >
                      {conversation.is_saved ? (
                        <Star className="h-4 w-4 fill-current" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                      <span className="sr-only">{conversation.is_saved ? 'Poista tallennus' : 'Tallenna'}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeleteConversation(e, conversation.id)}
                      title="Poista keskustelu"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Poista</span>
                    </Button>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistorySidebar;
