// src/components/chat/MessageList.tsx
import React, { useRef, useEffect } from "react";
import MessageItem from "./MessageItem";
import { Message } from "./types";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  emptyStateAction?: () => void;
  hasCompanyContext: boolean;
  disableAutoScroll?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  emptyStateAction,
  hasCompanyContext,
  disableAutoScroll = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages change paitsi jos autoscroll on disabled
  useEffect(() => {
    if (!disableAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, disableAutoScroll]);

  return (
    <div className="flex flex-col w-full space-y-6 max-w-none">
      {messages.map((message, index) => (
        <MessageItem 
          key={index} 
          message={message}
          isLoading={false}
        />
      ))}

      {/* Loading indicator for new message */}
      {isLoading && (
        <MessageItem 
          message={{ 
            role: "assistant", 
            content: "" 
          }} 
          isLoading={true}
        />
      )}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;