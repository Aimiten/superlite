// src/components/chat/ChatHeader.tsx
import React, { useState } from "react";
import { TrashIcon, PlusCircle, ChevronDown, Building2, Info, X, Star } from "lucide-react";
import { CompanyContext, TaskContext, Message } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose
} from "@/components/ui/popover";

interface ChatHeaderProps {
  companyContext: CompanyContext | null;
  taskContext: TaskContext | null;
  isLoadingContext: boolean;
  onLoadCompanyContext: () => void;
  hasMessages: boolean;
  onClearChat: () => void;
  companies?: { id: string; name: string }[];
  onCompanyChange?: (companyId: string) => void;
  messages?: Message[];
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  companyContext,
  taskContext,
  isLoadingContext,
  onLoadCompanyContext,
  hasMessages,
  onClearChat,
  companies = [],
  onCompanyChange,
  messages = []
}) => {
  // Formatoi aikaleima - käytetään viimeksi päivitetyn näyttämiseen
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('fi-FI', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Kompakti header kaikissa tiloissa
  return (
    <div className="border-b bg-white shadow-neumorphic">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Vasen puoli: Yritysten valinta */}
          <div className="flex items-center gap-2">
            {companies.length > 0 && onCompanyChange ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 flex items-center">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="max-w-[200px] truncate font-medium">
                      {companyContext?.companyData?.name || "Valitse yritys"}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Valitse yritys</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {companies.map(company => (
                    <DropdownMenuItem 
                      key={company.id}
                      onClick={() => onCompanyChange(company.id)}
                      className="cursor-pointer"
                    >
                      {company.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : companyContext ? (
              <div className="flex items-center gap-1.5 text-sm px-2 py-1 bg-primary/10 text-primary rounded-md">
                <Building2 className="h-3.5 w-3.5" />
                <span className="font-medium">{companyContext.companyData?.name}</span>
                {companyContext.lastUpdated && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (päiv. {formatTimestamp(companyContext.lastUpdated)})
                  </span>
                )}
              </div>
            ) : null}

            {/* Tehtävätietojen info-nappi */}
            {taskContext && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-7 h-7 p-0 rounded-full hover:bg-muted ml-2"
                  >
                    <Info className="h-4 w-4 text-primary" />
                    <span className="sr-only">Tehtävän tiedot</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm">Tehtävän tiedot</h3>
                    <PopoverClose className="rounded-full w-5 h-5 p-0 flex items-center justify-center opacity-70 hover:opacity-100">
                      <X className="h-3 w-3" />
                    </PopoverClose>
                  </div>
                  <h4 className="text-sm font-bold">{taskContext.taskTitle}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{taskContext.taskDescription}</p>

                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    <p>AI-assistentti voi auttaa tämän tehtävän suorittamisessa. Voit tallentaa AI:n vastauksen tai luodun dokumentin suoraan tehtävään.</p>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Oikea puoli: Chat-hallinta näkyy vain keskustelutilassa */}
          {hasMessages && (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearChat}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                <span>Tyhjennä</span>
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Uusi keskustelu</span>
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (messages && messages.length > 0) {
                    const title = messages[0].content.substring(0, 50) + (messages[0].content.length > 50 ? "..." : "");
                    const { data, error } = supabase.functions.invoke("save-conversation", {
                      body: {
                        title: title,
                        messages: messages,
                        is_saved: true,
                        company_id: companyContext?.companyData?.id,
                        task_id: taskContext?.taskId
                      }
                    });
                    
                    // Ilmoitus käyttäjälle tallennuksen onnistumisesta/epäonnistumisesta
                    if (error) {
                      console.error("Virhe keskustelun tallennuksessa:", error);
                      alert("Keskustelun tallentaminen epäonnistui.");
                    } else {
                      alert("Keskustelu tallennettu!");
                    }
                  } else {
                    alert("Ei tallennettavia viestejä.");
                  }
                }}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Star className="h-3.5 w-3.5" />
                <span>Tallenna</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;