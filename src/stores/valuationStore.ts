import { create } from 'zustand';

export interface UploadedFile {
  id: string;
  name: string;
  data: string;
  base64?: string;
  mimeType?: string;
  object: File | null;
}

interface ValuationState {
  latestValuationId: string | null;
  setLatestValuationId: (id: string | null) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  financialQuestions: any[];
  setFinancialQuestions: (questions: any[]) => void;
  financialAnswers: Record<string, string>;
  setFinancialAnswers: (answers: Record<string, string>) => void;
  updateFinancialAnswer: (questionId: string, category: string, value: string) => void;
  analysisStage: "analyzing" | "processing-questions" | "generating-report";
  analysisProgress: number;
  setAnalysisProgress: (stage: "analyzing" | "processing-questions" | "generating-report", progress: number) => void;

  uploadedFiles: UploadedFile[];
  selectedDocuments: string[];
  setUploadedFiles: (files: UploadedFile[]) => void;
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (fileId: string) => void;
  setSelectedDocuments: (documents: string[]) => void;

  companyInfo: any | null;
  financialAnalysis: any | null;
  valuationReport: any | null;
  rawApiData: any | null;
  requiresUserInput: boolean;
  initialFindings: any | null;

  setCompanyInfo: (info: any | null) => void;
  setFinancialAnalysis: (analysis: any | null) => void;
  setValuationReport: (report: any | null) => void;
  setRawApiData: (data: any | null) => void;
  setRequiresUserInput: (requires: boolean) => void;
  setInitialFindings: (findings: any | null) => void;

  isLoading: boolean;
  isProcessing: boolean;
  error: string;
  showNewValuationForm: boolean;
  selectedValuationId: string | null;

  setIsLoading: (loading: boolean) => void;
  setIsProcessing: (processing: boolean) => void;
  setError: (error: string) => void;
  setShowNewValuationForm: (show: boolean) => void; 
  setSelectedValuationId: (id: string | null) => void;

  resetValuationState: () => void;
  resetFileState: () => void;
  resetAnalysisState: () => void;
  resetAllState: () => void;
}

export const useValuationStore = create<ValuationState>((set) => ({
  latestValuationId: null,
  setLatestValuationId: (id) => set({ latestValuationId: id }),

  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),

  financialQuestions: [],
  setFinancialQuestions: (questions) => set({ financialQuestions: questions }),

  financialAnswers: {},
  setFinancialAnswers: (answers) => set({ financialAnswers: answers }),
  updateFinancialAnswer: (questionId, category, value) => 
    set((state) => ({
      financialAnswers: {
        ...state.financialAnswers,
        [`${category}_${questionId}`]: value
      }
    })),

  analysisStage: "analyzing",
  analysisProgress: 0,
  setAnalysisProgress: (stage, progress) => set({ analysisStage: stage, analysisProgress: progress }),

  uploadedFiles: [],
  selectedDocuments: [],
  setUploadedFiles: (files) => set({ uploadedFiles: files }),
  addUploadedFile: (file) => set((state) => ({ 
    uploadedFiles: [...state.uploadedFiles, file] 
  })),
  removeUploadedFile: (fileId) => set((state) => ({ 
    uploadedFiles: state.uploadedFiles.filter(f => f.id !== fileId),
    selectedDocuments: state.selectedDocuments.filter(id => id !== fileId)
  })),
  setSelectedDocuments: (documents) => set({ selectedDocuments: documents }),

  companyInfo: null,
  financialAnalysis: null,
  valuationReport: null,
  rawApiData: null,
  requiresUserInput: false,
  initialFindings: null,

  setCompanyInfo: (info) => set({ companyInfo: info }),
  setFinancialAnalysis: (analysis) => set({ financialAnalysis: analysis }),
  setValuationReport: (report) => set({ valuationReport: report }),
  setRawApiData: (data) => set({ rawApiData: data }),
  setRequiresUserInput: (requires) => set({ requiresUserInput: requires }),
  setInitialFindings: (findings) => set({ initialFindings: findings }),

  isLoading: false,
  isProcessing: false,
  error: "",
  showNewValuationForm: false,
  selectedValuationId: null,

  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setError: (error) => set({ error: error }),
  setShowNewValuationForm: (show) => set({ showNewValuationForm: show }),
  setSelectedValuationId: (id) => set({ selectedValuationId: id }),

  resetValuationState: () => set({
    currentStep: 1,
    financialQuestions: [],
    financialAnswers: {},
    analysisStage: "analyzing",
    analysisProgress: 0
  }),

  resetFileState: () => set({
    uploadedFiles: [],
    selectedDocuments: []
  }),

  resetAnalysisState: () => set({
    companyInfo: null,
    financialAnalysis: null,
    valuationReport: null,
    rawApiData: null,
    requiresUserInput: false,
    initialFindings: null,
    error: ""
  }),

  resetAllState: () => set({
    latestValuationId: null,
    currentStep: 1,
    financialQuestions: [],
    financialAnswers: {},
    analysisStage: "analyzing",
    analysisProgress: 0,
    uploadedFiles: [],
    selectedDocuments: [],
    companyInfo: null,
    financialAnalysis: null,
    valuationReport: null,
    rawApiData: null,
    requiresUserInput: false,
    initialFindings: null,
    isLoading: false,
    isProcessing: false,
    error: "",
    selectedValuationId: null
  })
}));