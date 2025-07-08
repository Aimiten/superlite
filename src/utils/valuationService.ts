import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/utils/edge-function";
import { readFileAsText, readFileAsBase64 } from "@/utils/DocumentRead";
import { UploadedFile } from "@/stores/valuationStore";

// Apufunktio Markdown-koodilohkojen puhdistamiseen JSON-datasta
const cleanMarkdownCodeBlocks = (data: any): any => {
  if (!data) return data;

  // Jos kyseessä on merkkijono
  if (typeof data === 'string') {
    // Poista markdown json-koodilohkon merkinnät
    return data.replace(/^```json\s*\n/gm, '').replace(/\n```$/gm, '');
  }

  // Jos kyseessä on objekti, käy läpi kaikki kentät rekursiivisesti
  if (typeof data === 'object' && data !== null) {
    const result = Array.isArray(data) ? [...data] : {...data};

    for (const key in result) {
      result[key] = cleanMarkdownCodeBlocks(result[key]);
    }

    return result;
  }

  return data;
};

export const valuationService = {
  async saveValuationProgress(valuationId: string, data: {
    current_step?: number,
    financial_questions?: any[],
    financial_answers?: Record<string, string>,
    analysis_stage?: string,
    analysis_progress?: number
  }): Promise<boolean> {
    try {
      if (!valuationId) return false;

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return false;

      const { data: existingValuation, error: fetchError } = await supabase
        .from('valuations')
        .select('id, user_id')
        .eq('id', valuationId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !existingValuation) return false;

      const { data: currentData } = await supabase
        .from('valuations')
        .select('progress_data')
        .eq('id', valuationId)
        .single();

      let updatedProgressData = {};
      if (currentData && currentData.progress_data) {
        updatedProgressData = { ...currentData.progress_data };
      }

      if (data.current_step !== undefined) updatedProgressData.current_step = data.current_step;
      if (data.financial_questions) updatedProgressData.financial_questions = data.financial_questions;

      if (data.financial_answers) {
        updatedProgressData.financial_answers = {
          ...updatedProgressData.financial_answers || {},
          ...data.financial_answers
        };
      }

      if (data.analysis_stage) updatedProgressData.analysis_stage = data.analysis_stage;
      if (data.analysis_progress !== undefined) updatedProgressData.analysis_progress = data.analysis_progress;

      updatedProgressData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('valuations')
        .update({ progress_data: updatedProgressData })
        .eq('id', valuationId)
        .eq('user_id', user.id);

      return !error;
    } catch (error) {
      console.error("Error saving valuation progress:", error);
      return false;
    }
  },

  async loadValuationProgress(valuationId: string): Promise<{
    current_step?: number,
    financial_questions?: any[],
    financial_answers?: Record<string, string>,
    analysis_stage?: string,
    analysis_progress?: number,
    error?: string
  }> {
    try {
      if (!valuationId) return { error: "ValuationId puuttuu" };

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return { error: "Käyttäjää ei löydy" };

      const { data, error } = await supabase
        .from('valuations')
        .select('progress_data')
        .eq('id', valuationId)
        .eq('user_id', user.id)
        .single();

      if (error) return { error: `Tietojen haku epäonnistui: ${error.message}` };
      if (!data || !data.progress_data) return {};

      return data.progress_data;
    } catch (error: any) {
      return { error: `Virhe tilan hakemisessa: ${error.message}` };
    }
  },

  async fetchValuationById(valuationId: string) {
    if (!valuationId) throw new Error("ValuationId puuttuu");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) throw new Error("Käyttäjää ei löydy");

    const { data, error } = await supabase
      .from('valuations')
      .select('*')
      .eq('id', valuationId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Arvonmääritystä ei löytynyt");

    // Puhdistetaan mahdolliset Markdown-koodilohkot
    const cleanedData = cleanMarkdownCodeBlocks(data);

    return cleanedData;
  },

  async fetchSavedValuations() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) throw new Error("Käyttäjää ei löydy");

    const { data, error } = await supabase
      .from('valuations')
      .select('id, company_name, created_at, results')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Puhdistetaan mahdolliset Markdown-koodilohkot
    const cleanedData = data ? cleanMarkdownCodeBlocks(data) : [];

    return cleanedData;
  },

  async fetchSavedDocuments(companyId: string) {
    if (!companyId) return [];

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) throw new Error("Käyttäjää ei löydy");

    const { data, error } = await supabase
      .from('company_documents')
      .select('id, name, file_path, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  isValidUUID(uuid: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
  },

  async uploadDocument(file: File, userId: string, companyId: string): Promise<string | null> {
    if (!userId || !file) return null;

    try {
      const filePath = `${userId}/${companyId || 'no_company'}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from('company-files')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (error) throw error;
      return filePath;
    } catch (err) {
      console.error("Error uploading document:", err);
      return null;
    }
  },

  async getDocumentContent(filePathOrId: string): Promise<{ text: string | null, base64: string | null, mimeType: string, name: string } | null> {
    try {
      let actualFilePath = filePathOrId;
      let documentName = filePathOrId.split('/').pop() || 'unnamed_file';
      let bucketName = 'company-files';

      if (!filePathOrId.includes('/')) {
        if (!this.isValidUUID(filePathOrId)) {
          throw new Error(`Invalid UUID format: "${filePathOrId}"`);
        }

        const { data: document, error: docError } = await supabase
          .from('company_documents')
          .select('name, file_path')
          .eq('id', filePathOrId)
          .single();

        if (docError || !document || !document.file_path) {
          throw new Error("Document details not found");
        }

        actualFilePath = document.file_path;
        documentName = document.name || documentName;

        if (actualFilePath.startsWith('public/')) bucketName = 'company_documents';
      } else if (filePathOrId.startsWith('public/')) {
        bucketName = 'company_documents';
      }

      const { data: fileData, error: fileError } = await supabase.storage
        .from(bucketName)
        .download(actualFilePath);

      if (fileError) throw fileError;

      const tempFile = new File([fileData], documentName, { type: fileData.type });

      const text = await readFileAsText(tempFile);
      let base64 = null;

      if (tempFile.type === "application/pdf") {
        base64 = await readFileAsBase64(tempFile);
      }

      return { text, base64, mimeType: tempFile.type, name: documentName };
    } catch (err) {
      console.error("Dokumentin sisällön hakeminen epäonnistui:", err);
      return null;
    }
  },

  async processFile(file: File): Promise<UploadedFile> {
    let text = "";
    let base64 = null;

    // PDF:t käsitellään vain base64:na, ei tekstinä
    if (file.type === "application/pdf") {
      console.log(`Processing PDF file: ${file.name}, size: ${file.size} bytes`);
      base64 = await readFileAsBase64(file);
      text = ""; // Tyhjä string PDF:lle
      console.log(`PDF base64 length: ${base64.length} characters`);
    } else {
      // Muut tiedostot (CSV, TXT) luetaan tekstinä
      console.log(`Processing text file: ${file.name}, size: ${file.size} bytes`);
      text = await readFileAsText(file);
      console.log(`Text length: ${text.length} characters`);
    }

    return {
      id: `upload-${Date.now()}-${file.name}`,
      name: file.name,
      data: text, // Tyhjä PDF:lle, sisältö muille
      base64,       // null muille, base64 PDF:lle  
      mimeType: file.type,
      object: file
    };
  },

  // ========== UUDET QUEUE-METODIT ==========
  async queueDocumentAnalysis(
    companyName: string, 
    files: UploadedFile[], 
    companyType: string,
    companyId: string
  ): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await callEdgeFunction('analyze-valuation-documents', {
      companyName,
      companyType,
      files: files.map(file => ({
        id: file.id, 
        name: file.name, 
        data: file.data,
        base64: file.base64, 
        mimeType: file.mimeType
      })),
      userId: user.id,
      companyId: companyId
      // Multiplier-asetukset haetaan backend:ssä user_multiplier_settings taulusta
    });

    if (error) throw new Error(error.message);
    if (!data.analysisId) throw new Error("No analysis ID returned");

    return data.analysisId;
  },

  async pollAnalysisStatus(analysisId: string) {
    const { data, error } = await supabase
      .from('valuation_document_analysis')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (error) throw error;

    // Puhdista markdown-koodilohkot
    return cleanMarkdownCodeBlocks(data);
  },
  async saveMultiplierSettings(method: 'manual', customMultipliers: any) {
    const { data, error } = await callEdgeFunction('save-multiplier-settings', {
      method,
      customMultipliers
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // ==========================================

  async analyzeCompany(
    companyName: string, 
    files: UploadedFile[], 
    companyType?: string,
    multiplierMethod?: 'ai' | 'manual',
    customMultipliers?: any
  ) {
    const requestBody = {
      companyName,
      files: files.map(file => ({
        id: file.id,
        name: file.name,
        data: file.data,
        base64: file.base64,
        mimeType: file.mimeType
      })),
      companyType,
      multiplierMethod,
      customMultipliers
    };

    const { data, error: apiError } = await callEdgeFunction(
      'valuation', requestBody, { maxRetries: 3, showToasts: true }
    );

    if (apiError) throw new Error(apiError.message);
    if (data.error) throw new Error(data.error);

    // Puhdista markdown-koodilohkot kaikesta datasta
    return cleanMarkdownCodeBlocks(data);
  },

  async processQuestionAnswers(
    companyName: string,
    files: UploadedFile[],
    financialQuestionAnswers: Record<string, string>,
    originalQuestions: any[],
    companyType?: string,
    analysisId?: string
  ) {
    const requestBody = {
      companyName,
      files: files.map(file => ({
        id: file.id,
        name: file.name,
        data: file.data,
        base64: file.base64,
        mimeType: file.mimeType
      })),
      financialQuestionAnswers,
      originalQuestions,
      companyType,
      analysisId
    };

    const { data, error: apiError } = await callEdgeFunction(
      'valuation', requestBody, { maxRetries: 3, showToasts: true }
    );

    if (apiError) throw new Error(apiError.message);
    if (data.error) throw new Error(data.error);

    // Puhdista markdown-koodilohkot kaikesta datasta
    return cleanMarkdownCodeBlocks(data);
  },

  async saveValuationToDatabase(
    user: any,
    activeCompany: any,
    uploadedFiles: UploadedFile[],
    selectedDocuments: string[],
    currentStep: number,
    analysisStage: string,
    analysisProgress: number,
    financialQuestions: any[],
    financialAnswers: Record<string, string>,
    valuationReport: any,
    financialAnalysis: any,
    companyInfo: any,
    requiresUserInput: boolean,
    initialFindings: any
  ) {
    if (!user || !activeCompany || !valuationReport) return null;

    try {
      const documentIds = [];

      for (const file of uploadedFiles) {
        if (file.object && !selectedDocuments.includes(file.id)) {
          const path = await this.uploadDocument(file.object, user.id, activeCompany.id);
          if (path) documentIds.push(path);
        } else if (selectedDocuments.includes(file.id)) {
          documentIds.push(file.id);
        } else if (!file.object && (file.id.includes('/') || this.isValidUUID(file.id))) {
          documentIds.push(file.id);
        }
      }

      const cleanedFinancialAnalysis = financialAnalysis ? { ...financialAnalysis } : null;
      if (cleanedFinancialAnalysis?.fileData) delete cleanedFinancialAnalysis.fileData;

      const progressData = {
        current_step: currentStep,
        analysis_stage: analysisStage,
        analysis_progress: analysisProgress,
        financial_questions: financialQuestions,
        financial_answers: financialAnswers || {}
      };

      const valuationData = {
        user_id: user.id,
        company_id: activeCompany.id,
        company_name: activeCompany.name,
        document_ids: [...new Set(documentIds)],
        results: {
          valuationReport,
          financialAnalysis: cleanedFinancialAnalysis,
          companyInfo,
          requiresUserInput,
          financialQuestions,
          initialFindings
        },
        progress_data: progressData
      };

      const { data, error } = await supabase
        .from('valuations')
        .insert(valuationData)
        .select();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Arvonmäärityksen tallennus epäonnistui:", err);
      return null;
    }
  }
};