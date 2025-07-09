// src/components/chat/types.ts
export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: {
    title: string;
    url: string;
  }[];
}

export interface CompanyContext {
  companyData: any;
  companyInfo?: any;
  valuation?: any;
  lastUpdated: Date;
}

export interface TaskContext {
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  taskType: string;
}

export interface DocumentGeneration {
  content: string;
  format: string;
}

export interface MessageInputProps {
  message: string;
  onChange: (value: string) => void;
  onSend: (e: React.FormEvent) => void;
  isLoading: boolean;
  isDisabled: boolean;
  onFileUpload: () => void;
  uploadedFile: File | null;
  // Lisätty uudet propst FileUploader-komponentille
  fileInputRef?: React.RefObject<HTMLInputElement>;
  onFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  acceptedFormats?: string;
}

export interface MessageItemProps {
  message: Message;
  isLoading?: boolean;
}

export interface FileUploadPreviewProps {
  file: File;
  onRemove: () => void;
}

export interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  companyContext: CompanyContext | null;
  taskContext: TaskContext | null;
  isLoadingContext: boolean;
  documentGenerationReady: boolean;
  generatedDocument: DocumentGeneration | null;
  message: string;
  uploadedFile: File | null;
  fileContent?: string | null;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent, contentOverride?: string) => void;
  onFileUpload: () => void;
  onRemoveFile: () => void;
  onLoadCompanyContext: () => void;
  onGenerateDocument: () => void;
  onFormatSelect: (format: string, saveToTask?: boolean) => void;
  onClearChat: () => void;
  hasMessages: boolean;
  companies?: { id: string; name: string }[];
  onCompanyChange?: (companyId: string) => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
  onFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  acceptedFileFormats?: string;
  onHandlerAction?: (action: string, data?: any) => void;
}

// Uudet tehtäväeditori -komponenttien rajapinnat
export interface TaskPanelButtonProps {
  taskContext: TaskContext;
  onClick: () => void;
  isOpen: boolean;
}

export interface TaskEditorProps {
  taskContext: TaskContext;
  isOpen: boolean;
  onClose: () => void;
  onContentShare: (content: string) => void;
  onSaved?: () => void;
}