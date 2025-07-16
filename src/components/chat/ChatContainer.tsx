// src/components/chat/ChatContainer.tsx
import React, { useState, useRef } from "react";
import { Message, CompanyContext, TaskContext, DocumentGeneration, ChatContainerProps } from "./types";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import FileUploadPreview from "./FileUploadPreview";
import { Bot, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
            <p className="text-base text-center text-muted-foreground mb-8 max-w-md">
              Kysy neuvoa yrityskauppoihin, arvonmääritykseen ja myyntikuntoon liittyvissä asioissa.
            </p>

            {/* Company context status indicator */}
            {isLoadingContext ? (
              <div className="mb-6 flex items-center justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-info/10 border border-info/20 rounded-full">
                  <div className="h-2 w-2 bg-info rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-info">
                    Ladataan yritystietoja...
                  </span>
                </div>
              </div>
            ) : companyContext ? (
              <div className="mb-6 flex items-center justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/20 rounded-full cursor-help">
                        <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-success">
                          AI tuntee yrityksen: {companyContext.companyData?.name}
                        </span>
                        <Info className="h-3.5 w-3.5 text-success" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        AI-asiantuntija käyttää yrityksesi tietoja antaakseen 
                        räätälöityjä neuvoja ja suosituksia. Tiedot sisältävät 
                        perustiedot, arvonmääritykset ja yrityskohtaiset dokumentit.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : null}

            {/* Syöttökenttä keskellä */}
            <div className="w-full max-w-4xl shadow-neumorphic rounded-xl border border-muted bg-white p-6">
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
      <div className="bg-muted/50 pt-4 pb-4 border-t">
        <div className="max-w-2xl mx-auto px-4">
          {/* Company context indicator in chat mode */}
          {isLoadingContext ? (
            <div className="mb-3 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-info/10 border border-info/20 rounded-full text-xs">
                <div className="h-1.5 w-1.5 bg-info rounded-full animate-pulse" />
                <span className="font-medium text-info">
                  Ladataan yritystietoja...
                </span>
              </div>
            </div>
          ) : companyContext ? (
            <div className="mb-3 flex items-center justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-full text-xs cursor-help">
                      <div className="h-1.5 w-1.5 bg-success rounded-full animate-pulse" />
                      <span className="font-medium text-success">
                        AI käyttää yrityksen tietoja: {companyContext.companyData?.name}
                      </span>
                      <Info className="h-3 w-3 text-success" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      AI käyttää {companyContext.companyData?.name} -yrityksen 
                      tietoja vastauksissa. Tämä sisältää perustiedot, 
                      arvonmääritykset ja muut tallennetut dokumentit.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : null}

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