// src/components/chat/MessageItem.tsx
import React, { useState } from "react";
import { Bot, User, Copy, Check, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { MessageItemProps } from "./types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  isLoading
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === "user";

  return (
    <div className={cn(
      "flex w-full mb-5 last:mb-0",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-full rounded-2xl p-4 shadow-sm",
        isUser
          ? "bg-primary/90 text-white rounded-tr-none"
          : "bg-white border border-gray-100 rounded-tl-none"
      )}>
        <div className="flex items-center gap-2 mb-2">
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4 text-primary" />
          )}
          <span className="text-sm font-medium">
            {isUser ? "Sinä" : "AI-asiantuntija"}
          </span>

          {/* Toimintopainikkeet AI-viesteille */}
          {!isUser && (
            <div className="ml-auto">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 hover:bg-gray-100" 
                      onClick={copyToClipboard}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copied ? "Kopioitu!" : "Kopioi vastaus"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Message content */}
        {isUser ? (
          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Sources section */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <p className="text-xs text-muted-foreground mb-1">Lähteet:</p>
            <div className="space-y-1">
              {message.sources.map((source, sourceIndex) => (
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


        {/* Loading indicator for the assistant */}
        {!isUser && isLoading && (
          <div className="flex items-center gap-1.5 mt-2 text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150"></span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse delay-300"></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;