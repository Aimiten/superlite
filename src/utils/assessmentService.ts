// src/utils/assessmentService.ts
import { supabase } from "@/integrations/supabase/client";
import { DocumentWithContent, Question, AnalysisResults, CompanyData } from '@/components/assessment/types';

export const assessmentService = {
  /**
   * Fetches or creates an assessment session
   */
  async fetchOrCreateSession(companyId: string, companyName: string = ""): Promise<string> {
    if (!companyId) {
      throw new Error("Company ID is required");
    }

    try {
      // Hae ensin käyttäjän tiedot - KORJATTU
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Try to find an existing draft session
      const { data: existingSession, error: fetchError } = await supabase
        .from('assessments')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'draft')
        .order('last_activity', { ascending: false })
        .limit(1)
        .single();

      if (existingSession) {
        console.log("Found existing assessment session:", existingSession.id);
        return existingSession.id;
      }

      // Get company name if not provided
      if (!companyName && companyId) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .single();

        if (!companyError && companyData) {
          companyName = companyData.name;
        }
      }

      // Create new draft session - KORJATTU user_id
      const { data: newSession, error: createError } = await supabase
        .from('assessments')
        .insert({
          company_id: companyId,
          company_name: companyName || "Nimetön yritys", 
          user_id: user.id, // KORJATTU: Lisätty user_id
          status: 'draft',
          current_step: 'initial-selection',
          last_activity: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create assessment: ${createError.message}`);
      }

      return newSession.id;
    } catch (error) {
      console.error("Error in fetchOrCreateSession:", error);
      throw error;
    }
  },

  /**
   * Gets a specific assessment session by ID
   */
  async getSession(assessmentId: string) {
    if (!assessmentId) {
      throw new Error("Assessment ID is required");
    }

    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch assessment: ${error.message}`);
    }

    return data;
  },

  /**
   * Updates an assessment session
   */
  async updateSession(assessmentId: string, updates: Record<string, any>) {
    if (!assessmentId) {
      throw new Error("Assessment ID is required");
    }

    try {
      // Varmistetaan käyttäjätiedot - KORJATTU
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Varmistetaan ensin, että päivitettävä arviointi kuuluu tälle käyttäjälle - KORJATTU
      const { data: existingAssessment, error: fetchError } = await supabase
        .from('assessments')
        .select('id, user_id')
        .eq('id', assessmentId)
        .eq('user_id', user.id)  // Varmista että kuuluu tälle käyttäjälle
        .maybeSingle();

      if (fetchError) {
        console.error("Failed to verify assessment ownership:", fetchError.message);
        throw new Error(`Failed to verify assessment ownership: ${fetchError.message}`);
      }
      
      if (!existingAssessment) {
        console.error("Assessment not found or access denied");
        throw new Error("Assessment not found or access denied");
      }

      // Nyt voimme päivittää turvallisesti - KORJATTU
      const { error } = await supabase
        .from('assessments')
        .update({
          ...updates,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', assessmentId)
        .eq('user_id', user.id); // Varmista vielä päivitysvaiheessa

      if (error) {
        throw new Error(`Failed to update assessment: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Error in updateSession:", error);
      throw error;
    }
  },

  /**
   * Get completed and draft assessments for user
   */
  async getCompletedAssessments() {
    try {
      // Varmistetaan käyttäjätiedot RLS:ää varten
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        throw new Error("User not authenticated");
      }

      console.log("Haetaan arviointeja käyttäjälle:", user.id);

      // Haetaan sekä 'completed' että 'draft' tilassa olevat arvioinnit
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['completed', 'draft'])
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }

      console.log(`Löydettiin ${data?.length || 0} arviointia`);
      return { data, error };
    } catch (error) {
      console.error("Error fetching completed assessments:", error);
      throw error;
    }
  },

  /**
   * Get a specific completed assessment by ID
   */
  async getCompletedAssessment(assessmentId: string) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .eq('user_id', user.id) 
        .in('status', ['completed', 'draft'])  // Modified to accept both statuses
        .single();

      return { data, error };
    } catch (error: any) {
      console.error("Error fetching assessment by ID:", error);
      throw error;
    }
  },

  /**
   * Get previous companies the user has worked with
   */
  async getPreviousCompanies() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error("User not authenticated");

      // Get unique company names from assessments
      const { data: assessmentCompanies, error: assessmentError } = await supabase
        .from('assessments')
        .select('company_name')
        .eq('user_id', user.id) 
        .order('created_at', { ascending: false });

      if (assessmentError) {
        throw assessmentError;
      }

      // Get unique company names from valuations
      const { data: valuationCompanies, error: valuationError } = await supabase
        .from('valuations')
        .select('company_name')
        .eq('user_id', user.id) 
        .order('created_at', { ascending: false });

      // Combine and deduplicate
      const companiesSet = new Set([
        ...(assessmentCompanies || []).map(item => item.company_name),
        ...(valuationCompanies || []).map(item => item.company_name)
      ].filter(Boolean));

      const uniqueCompanies = Array.from(companiesSet).map(name => ({ name }));

      return { data: uniqueCompanies };
    } catch (error) {
      console.error("Error fetching previous companies:", error);
      throw error;
    }
  },

  /**
   * Uploads and processes documents
   */
  async uploadDocuments(files: FileList, companyId: string): Promise<{ documents: DocumentWithContent[] }> {
    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    try {
      // First, upload raw files to storage
      const uploadResults = await this.uploadFilesToStorage(files, companyId);

      // Process the files on backend
      const processedDocs = await Promise.all(
        uploadResults.map(async (doc) => {
          const content = await this.getDocumentContent(doc.id);
          return content || doc;
        })
      );

      return { documents: processedDocs.filter(Boolean) as DocumentWithContent[] };
    } catch (error) {
      console.error("Error uploading documents:", error);
      throw error;
    }
  },

  /**
   * Helper to upload files to storage and create document records
   */
  async uploadFilesToStorage(files: FileList, companyId: string): Promise<DocumentWithContent[]> {
    const uploadedDocs: DocumentWithContent[] = [];
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Lisätään UUID tiedostonimeen uniikkiuden varmistamiseksi
      const uniqueFileName = `${Date.now()}_${crypto.randomUUID()}_${file.name}`;
      const filePath = `${user.id}/${companyId}/${uniqueFileName}`;

      // Upload to storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('company-files')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from('company_documents')
        .insert({
          company_id: companyId,
          name: file.name, 
          document_type: this.inferDocumentType(file.name),
          file_path: filePath, 
          file_type: file.type
        })
        .select()
        .single();

      if (docError) {
        throw new Error(`Document record creation failed: ${docError.message}`);
      }

      uploadedDocs.push({
        id: docData.id,
        name: docData.name,
        file_path: docData.file_path,
        file_type: docData.file_type,
        document_type: docData.document_type,
        created_at: docData.created_at,
        mimeType: file.type,
        text: null, // Will be populated later
        base64: null, // Will be populated later
        error: null,
        fileObject: file, // Säilytetään File-objekti väliaikaisesti
        isNew: true
      });
    }

    return uploadedDocs;
  },

  /**
   * Helper to infer document type from filename
   */
  inferDocumentType(filename: string): string {
    const lowercase = filename.toLowerCase();

    if (lowercase.includes('tilinpäätös') || lowercase.includes('tilinpaatos') ||
        lowercase.includes('tulos') || lowercase.includes('tase')) {
      return 'tilinpäätös';
    }

    if (lowercase.includes('liiketoiminta') || lowercase.includes('business') ||
        lowercase.includes('plan') || lowercase.includes('suunnitelma')) {
      return 'liiketoimintasuunnitelma';
    }

    if (lowercase.includes('myynti') || lowercase.includes('sales') ||
        lowercase.includes('markkinointi') || lowercase.includes('marketing')) {
      return 'myyntimateriaali';
    }

    if (lowercase.includes('organisaatio') || lowercase.includes('organization') ||
        lowercase.includes('kaavio') || lowercase.includes('chart')) {
      return 'organisaatiokaavio';
    }

    if (lowercase.includes('prosessi') || lowercase.includes('process')) {
      return 'prosessikuvaus';
    }

    return 'muu';
  },

  /**
   * Get latest valuation ID for company
   */
  async getLatestValuationId(userId: string, companyId?: string | null): Promise<{
    valuationId?: string;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('valuations')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return { valuationId: undefined };
        }
        throw error;
      }

      return { valuationId: data?.id };
    } catch (error: any) {
      return { error: error.message || 'Unknown error' };
    }
  },

  /**
   * Get documents from a valuation
   */
  async getValuationDocuments(valuationId: string): Promise<{
    documents?: DocumentWithContent[];
    error?: string;
  }> {
    try {
      console.log(`Haetaan dokumentteja arvonmäärityksestä ID: ${valuationId}`);

      // Hae ensin arvonmäärityksen tiedot ja dokumenttien ID:t
      const { data: valuationData, error: valuationError } = await supabase
        .from('valuations')
        .select('document_ids, company_id, company_name') 
        .eq('id', valuationId)
        .single();

      if (valuationError) {
        console.error("Virhe arvonmäärityksen haussa:", valuationError);
        // Tarkempi virheilmoitus
        if (valuationError.code === '42703') { // Column does not exist
            return { error: `Arvonmääritystä ei löytynyt tai tietokantarakenne on virheellinen (sarake 'document_ids' puuttuu)` };
        }
        return { error: `Arvonmääritystä ei löytynyt: ${valuationError.message}` };
      }

      if (!valuationData) {
        return { error: "Arvonmääritystä ei löytynyt" };
      }

      console.log("Arvonmäärityksen tiedot:", valuationData);

      // Jos document_ids-kenttä puuttuu tai on tyhjä, yritä hakea yhtiön kaikki dokumentit
      if (!valuationData.document_ids || !Array.isArray(valuationData.document_ids) || valuationData.document_ids.length === 0) {
        console.log("Ei document_ids-kenttää tai se on tyhjä, yritetään hakea kaikki yhtiön dokumentit");

        if (!valuationData.company_id) {
          console.warn("Company ID puuttuu valuaatiosta, ei voida hakea kaikkia dokumentteja.");
          return { documents: [] }; // Palautetaan tyhjä lista, jos company_id puuttuu
        }

        const { data: companyDocs, error: docsError } = await supabase
          .from('company_documents')
          .select('*')
          .eq('company_id', valuationData.company_id);

        if (docsError) {
          return { error: `Yhtiön dokumenttien haku epäonnistui: ${docsError.message}` };
        }

        if (!companyDocs || companyDocs.length === 0) {
          return { documents: [] };
        }

        // Hae dokumenttien sisältö
        const documents: DocumentWithContent[] = [];
        for (const doc of companyDocs) {
          try {
            const content = await this.getDocumentContent(doc.id);
            if (content) {
              documents.push(content);
            }
          } catch (e) {
            console.warn(`Virhe dokumentin ${doc.id} sisällön haussa:`, e);
          }
        }

        return { documents };
      }

      // Jos document_ids on määritetty, käytä sitä
      const documentIds: string[] = valuationData.document_ids; 

      console.log("Dokumenttien ID:t:", documentIds);

      // Hae dokumentit ID:iden perusteella
      const { data: companyDocs, error: docsError } = await supabase
        .from('company_documents')
        .select('*')
        .in('id', documentIds); 

      if (docsError) {
        return { error: `Dokumenttien haku epäonnistui: ${docsError.message}` };
      }

      // Hae dokumenttien sisältö
      const documents: DocumentWithContent[] = [];
      for (const doc of (companyDocs || [])) {
        try {
          const content = await this.getDocumentContent(doc.id);
          if (content) {
            documents.push(content);
          }
        } catch (e) {
          console.warn(`Virhe dokumentin ${doc.id} sisällön haussa:`, e);
        }
      }

      return { documents };
    } catch (error: any) {
      console.error("Virhe dokumenttien haussa:", error);
      return { error: error.message || "Tuntematon virhe" };
    }
  },

  /**
   * Get document content by ID
   */
  async getDocumentContent(documentId: string): Promise<DocumentWithContent | null> {
    try {
      // Get document metadata
      const { data: docMetadata, error: metadataError } = await supabase
        .from('company_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (metadataError) {
        throw new Error(`Failed to fetch document metadata: ${metadataError.message}`);
      }

      // Get document content (simplified here, you might want to use an edge function)
      let { data: fileData, error: downloadError } = await supabase.storage
        .from('company-files')
        .download(docMetadata.file_path);

      if (downloadError) {
        // Yritetään hakea vanhasta bucketista jos uusi epäonnistuu
        console.warn(`Failed to download from company-files (${docMetadata.file_path}), trying company_documents bucket...`);
        const { data: oldFileData, error: oldDownloadError } = await supabase.storage
          .from('company_documents') // Oletetaan vanha bucketin nimi
          .download(docMetadata.file_path);

        if (oldDownloadError) {
          console.error(`Failed to download from both buckets: ${downloadError.message} | ${oldDownloadError.message}`);
          throw new Error(`Failed to download file: ${downloadError.message}`);
        }
        fileData = oldFileData; // Käytä vanhasta bucketista ladattua dataa
      }

      if (!fileData) {
        throw new Error("File data is null after download attempts.");
      }

      // Process text or base64 based on file type
      let text = null;
      let base64 = null;
      const fileType = docMetadata.file_type || ''; // Varmistetaan että fileType on merkkijono

      if (fileType.includes('text') ||
          fileType.includes('csv') ||
          fileType.includes('word') || // Lisätty word tarkistus
          fileType.includes('sheet') || // Lisätty sheet tarkistus
          fileType.includes('xml') || // Lisätty xml tarkistus
          fileType.includes('json')) { // Lisätty json tarkistus
        // Text files
        try {
          text = await fileData.text();
        } catch (textError) {
          console.warn(`Could not read file ${docMetadata.name} as text, trying base64. Error: ${textError.message}`);
          // Yritetään base64 jos tekstin luku epäonnistuu
          const reader = new FileReader();
          base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(fileData);
          });
        }
      } else {
        // Binary files (like PDF, images)
        const reader = new FileReader();
        base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]); // Remove the data URL prefix
          reader.onerror = reject;
          reader.readAsDataURL(fileData);
        });
      }

      return {
        id: docMetadata.id,
        name: docMetadata.name,
        file_path: docMetadata.file_path,
        file_type: docMetadata.file_type,
        document_type: docMetadata.document_type,
        created_at: docMetadata.created_at,
        mimeType: docMetadata.file_type, // Käytetään tallennettua tyyppiä
        text,
        base64,
        error: null,
        fileObject: null, // Ei File-objektia kun haetaan palvelimelta
        isNew: false
      };
    } catch (error: any) {
      console.error("Error fetching document content:", error);
      return null;
    }
  },

  /**
   * Start the assessment process
   */
  async startAssessment(
    companyName: string,
    documentsWithContent: DocumentWithContent[],
    valuationData?: any
  ): Promise<{
    companyInfo?: any;
    readinessForSaleInfo?: any;
    questions?: Question[];
    error?: string;
  }> {
    try {
      // Call the assessment Edge Function
      const { data, error } = await supabase.functions.invoke("assessment", {
        body: {
          companyName,
          generateQuestions: true,
          documents: documentsWithContent.map(doc => ({
            id: doc.id,
            name: doc.name,
            document_type: doc.document_type,
            file_path: doc.file_path,
            file_type: doc.file_type,
            text: doc.text,
            base64: doc.base64
          })),
          valuationData
        }
      });

      if (error) {
        throw new Error(`Network error: ${error.message}`);
      }

      if (!data) {
        throw new Error("API did not return data");
      }

      if (data.error) {
        throw new Error(`Server error: ${data.error}`);
      }

      return {
        companyInfo: data.companyInfo,
        readinessForSaleInfo: data.readinessForSaleInfo,
        questions: data.questions
      };
    } catch (error: any) {
      console.error("Error starting assessment:", error);
      return {
        error: error.message || "Unknown error in assessment startup"
      };
    }
  },

  // getCompletedAssessments-funktio on määritelty aiemmin

  /**
   * Analyze assessment answers
   */
  async analyzeAssessment(
    companyName: string,
    companyData: CompanyData | string | null,
    answers: Record<string, any>,
    documentsWithContent: DocumentWithContent[],
    readinessForSaleData?: any,
    valuationData?: any
  ): Promise<{
    finalAnalysis?: AnalysisResults;
    error?: string;
  }> {
    try {
      // Call the assessment Edge Function
      const { data, error } = await supabase.functions.invoke("assessment", {
        body: {
          companyName,
          companyData,
          answers,
          readinessForSaleData,
          documents: documentsWithContent.map(doc => ({
            id: doc.id,
            name: doc.name,
            document_type: doc.document_type,
            file_path: doc.file_path,
            file_type: doc.file_type,
            text: doc.text,
            base64: doc.base64
          })),
          valuationData
        }
      });

      if (error) {
        throw new Error(`Network error: ${error.message}`);
      }

      if (!data) {
        throw new Error("Analysis failed: no response from server");
      }

      if (data.error) {
        throw new Error(`Server error: ${data.error}`);
      }

      if (!data.finalAnalysis) {
        throw new Error("Analysis results not received");
      }

      if (data.finalAnalysis.error) {
        throw new Error(`Analysis failed: ${data.finalAnalysis.error}`);
      }

      return {
        finalAnalysis: data.finalAnalysis
      };
    } catch (error: any) {
      console.error("Error analyzing answers:", error);
      return {
        error: error.message || "Unknown error in answer analysis"
      };
    }
  }
};