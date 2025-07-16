// src/components/chat/MessageInput.tsx
import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";
import { MessageInputProps } from "./types";
import { cn } from "@/lib/utils";
import FileUploader from "./FileUploader"; // Lisätty import

const MessageInput: React.FC<MessageInputProps> = ({
  message,
  onChange,
  onSend,
  isLoading,
  isDisabled,
  onFileUpload,
  uploadedFile,
  fileInputRef, // Lisätty
  onFileChange, // Lisätty
  acceptedFormats // Lisätty
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get correct scrollHeight
    textarea.style.height = "auto";

    // Set new height based on scrollHeight (min 40px, max 200px)
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 200);
    textarea.style.height = `${newHeight}px`;
  }, [message]);

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !isDisabled && message.trim()) {
        onSend(e as any);
      }
    }
  };

  return (
    <form onSubmit={onSend} className="flex items-end gap-2 w-full">
      <div className={cn(
        "flex-grow relative min-h-[50px] max-h-[200px] overflow-hidden rounded-full", // Pyöreä muoto
        "border border-muted shadow-neumorphic bg-white focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary"
      )}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || isDisabled}
          placeholder="Kirjoita viestisi tähän..."
          className={cn(
            "w-full resize-none bg-transparent py-3 px-4 outline-none", // Lisää täytettä
            "text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          )}
          rows={1}
        />
      </div>

      {/* Korvattu Button FileUploader-komponentilla */}
      <FileUploader
        fileInputRef={fileInputRef}
        onFileChange={onFileChange}
        isDisabled={isDisabled}
        isLoading={isLoading}
        hasUploadedFile={!!uploadedFile}
        acceptedFormats={acceptedFormats}
      />

      <Button 
        type="submit" 
        disabled={isLoading || isDisabled || !message.trim()}
        className="flex-shrink-0 rounded-full px-5 h-[50px] text-white" // Pyöreä lähetyspainike ja valkoinen teksti
      >
        <SendHorizontal className="h-5 w-5 mr-2" />
        <span>Lähetä</span>
      </Button>
    </form>
  );
};

export default MessageInput;