// src/components/chat/ChatContainer.tsx
import React, { useState, useRef } from "react";
import { Message, CompanyContext, TaskContext, DocumentGeneration, ChatContainerProps } from "./types";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import FileUploadPreview from "./FileUploadPreview";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  companyContext,
  taskContext,
  isLoadingContext,
  documentGenerationReady,
  generatedDocument,
  message,
  uploadedFile,
  fileContent,
  onMessageChange,
  onSendMessage,
  onFileUpload,
  onRemoveFile,
  onLoadCompanyContext,
  onGenerateDocument,
  onFormatSelect,
  onClearChat,
  hasMessages,
  companies = [],
  onCompanyChange,
  fileInputRef,
  onFileChange,
  acceptedFileFormats,
  onHandlerAction
}) => {

  // Keskitetty empty state UI
  if (!hasMessages) {
    return (
      <div className="flex flex-col h-full bg-background">
        <ChatHeader 
          companyContext={companyContext}
          taskContext={taskContext}
          isLoadingContext={isLoadingContext}
          onLoadCompanyContext={onLoadCompanyContext}
          hasMessages={hasMessages}
          onClearChat={onClearChat}
          companies={companies}
          onCompanyChange={onCompanyChange}
        />

        {/* Keskitetty sisältö ja syöttökenttä */}
        <div className="flex-grow flex flex-col items-center justify-center px-4">
          <div className="max-w-4xl w-full flex flex-col items-center">
            <Bot className="h-16 w-16 mb-6 text-primary/50" />
            <h2 className="text-2xl font-medium mb-4 text-center">AI-asiantuntija</h2>
            <p className="text-center text-muted-foreground mb-8 max-w-md">
              Kysy neuvoa yrityskauppoihin, arvonmääritykseen ja myyntikuntoon liittyvissä asioissa.
            </p>

            {/* Syöttökenttä keskellä */}
            <div className="w-full max-w-4xl shadow-lg rounded-xl border border-gray-100 bg-white p-6">
              {uploadedFile && (
                <FileUploadPreview 
                  file={uploadedFile}
                  content={fileContent}
                  onRemove={onRemoveFile}
                />
              )}

              <MessageInput 
                message={message}
                onChange={onMessageChange}
                onSend={onSendMessage}
                isLoading={isLoading}
                isDisabled={!companyContext}
                onFileUpload={onFileUpload}
                uploadedFile={uploadedFile}
                fileInputRef={fileInputRef}
                onFileChange={onFileChange}
                acceptedFormats={acceptedFileFormats}
              />

              {!companyContext && (
                <div className="mt-4 text-sm text-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onLoadCompanyContext}
                    disabled={isLoadingContext}
                  >
                    Lataa yritystiedot
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normaali chat UI kun on viestejä
  return (
    <div className="flex flex-col h-full bg-background">
      <ChatHeader 
        companyContext={companyContext}
        taskContext={taskContext}
        isLoadingContext={isLoadingContext}
        onLoadCompanyContext={onLoadCompanyContext}
        hasMessages={hasMessages}
        onClearChat={onClearChat}
        companies={companies}
        onCompanyChange={onCompanyChange}
        messages={messages}
      />

      {/* Chat-alue */}
      <div className="flex-grow overflow-y-auto relative py-2">
        <div className="max-w-2xl mx-auto px-4">
          <MessageList 
            messages={messages}
            isLoading={isLoading}
            hasCompanyContext={!!companyContext}
            emptyStateAction={onLoadCompanyContext}
            taskContext={taskContext}
            onHandlerAction={onHandlerAction}
          />

        </div>
      </div>

      {/* Syöttörivi alhaalla */}
      <div className="bg-gray-50 pt-4 pb-4 border-t">
        <div className="max-w-2xl mx-auto px-4">
          {uploadedFile && (
            <FileUploadPreview 
              file={uploadedFile}
              content={fileContent}
              onRemove={onRemoveFile}
            />
          )}

          <MessageInput 
            message={message}
            onChange={onMessageChange}
            onSend={onSendMessage}
            isLoading={isLoading}
            isDisabled={!companyContext}
            onFileUpload={onFileUpload}
            uploadedFile={uploadedFile}
            fileInputRef={fileInputRef}
            onFileChange={onFileChange}
            acceptedFormats={acceptedFileFormats}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;