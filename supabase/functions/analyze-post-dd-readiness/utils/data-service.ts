// supabase/functions/analyze-post-dd-readiness/utils/data-service.ts

export async function fetchPreviousAnalysis(supabase: any, analysisId: string) {
  try {
    const { data, error } = await supabase
      .from("valuation_impact_analysis")
      .select("*")
      .eq("id", analysisId)
      .single();

    if (error) {
      return { previousAnalysis: null, error: error.message };
    }

    return { previousAnalysis: data, error: null };
  } catch (error) {
    console.error("Error fetching previous analysis:", error);
    return { previousAnalysis: null, error: error instanceof Error ? error.message : "Tuntematon virhe" };
  }
}

export async function fetchLatestAnalysis(supabase: any, companyId: string) {
  try {
    // Hae viimeisin analyysi analysis_phase='post_sales_readiness' (tai initial jos post ei löydy)
    const { data: postSalesReadiness, error: postError } = await supabase
      .from("valuation_impact_analysis")
      .select("*")
      .eq("company_id", companyId)
      .eq("analysis_phase", "post_sales_readiness")
      .order("calculation_date", { ascending: false })
      .limit(1)
      .single();

    if (!postError && postSalesReadiness) {
      console.log("Found post_sales_readiness analysis");
      return { latestAnalysis: postSalesReadiness, error: null };
    }

    // Kokeile hakea initial-analyysi, jos post_sales_readiness ei löydy
    const { data: initialAnalysis, error: initialError } = await supabase
      .from("valuation_impact_analysis")
      .select("*")
      .eq("company_id", companyId)
      .eq("analysis_phase", "initial")
      .order("calculation_date", { ascending: false })
      .limit(1)
      .single();

    if (initialError) {
      console.error("Error fetching initial analysis:", initialError);
      return { latestAnalysis: null, error: initialError.message };
    }

    return { latestAnalysis: initialAnalysis, error: null };
  } catch (error) {
    console.error("Error fetching latest analysis:", error);
    return { latestAnalysis: null, error: error instanceof Error ? error.message : "Tuntematon virhe" };
  }
}

export async function fetchCompanyData(supabase: any, companyId: string) {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (error) {
      return { companyData: null, error: error.message };
    }

    return { companyData: data, error: null };
  } catch (error) {
    console.error("Error fetching company data:", error);
    return { companyData: null, error: error instanceof Error ? error.message : "Tuntematon virhe" };
  }
}

export async function fetchDDTasks(supabase: any, companyId: string) {
  try {
    // Hae DD-tehtävät ja niiden vastaukset
    const { data, error } = await supabase
      .from("company_tasks")
      .select(`
        *,
        task_responses(*)
      `)
      .eq("company_id", companyId)
      .eq("dd_related", true);

    if (error) {
      return { ddTasks: [], ddTasksCompletionRate: 0, error: error.message };
    }

    // Laske DD-tehtävien valmiusaste
    const ddTasks = data || [];
    const completedDDTasks = ddTasks.filter(task => task.completion_status === "completed");
    const ddTasksCompletionRate = ddTasks.length > 0 ? completedDDTasks.length / ddTasks.length : 0;

    // Käsittele DD-task-vastauksissa olevat tiedostot
    console.log("Processing DD task responses for file attachments...");
    for (const task of ddTasks) {
      if (task.value?.filePath && task.value?.fileName) {
        try {
          console.log(`Loading DD task file: ${task.value.fileName} from path: ${task.value.filePath}`);

          // Lataa tiedosto task-files bucketista
          const { data, error } = await supabase.storage
            .from('task-files')
            .download(task.value.filePath);

          if (error) {
            console.error(`Error downloading DD task file ${task.value.fileName}:`, error);
            continue;
          }

          // Tarkista tiedostotyyppi
          if (task.value.fileType?.includes('pdf')) {
            // PDF-tiedosto - muunna base64-muotoon
            const arrayBuffer = await data.arrayBuffer();
            const base64 = btoa(
              new Uint8Array(arrayBuffer)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            // Lisää tiedoston sisältö task-objektiin (Gemini-yhteensopiva muoto)
            task.fileContent = {
              base64: base64,
              mime_type: task.value.fileType,
              name: task.value.fileName,
              document_type: 'dd_task_attachment'
            };
            console.log(`Loaded PDF content for DD task ${task.id}, ${base64.length} base64 chars`);
          } else if (task.value.fileType?.startsWith('text/')) {
            // Tekstitiedosto
            const text = await data.text();
            task.fileContent = {
              content: text,
              name: task.value.fileName,
              document_type: 'dd_task_attachment'
            };
            console.log(`Loaded text content for DD task ${task.id}, ${text.length} chars`);
          }
        } catch (error) {
          console.error(`Error processing DD task file for task ${task.id}:`, error);
        }
      }
    }

    return { ddTasks, ddTasksCompletionRate, error: null };
  } catch (error) {
    console.error("Error fetching DD tasks:", error);
    return { ddTasks: [], ddTasksCompletionRate: 0, error: error instanceof Error ? error.message : "Tuntematon virhe" };
  }
}

export async function fetchDocuments(supabase: any, companyId: string) {
  try {
    // Hae dokumentit company_documents-taulusta
    console.log(`Fetching document metadata for company ID: ${companyId}`);
    const { data: documents, error } = await supabase
      .from("company_documents")
      .select("*")
      .eq("company_id", companyId);

    if (error) {
      console.error("Error fetching documents:", error);
      return { documents: [], error: error.message };
    }

    console.log(`Found ${documents?.length || 0} documents in database`);

    // Käsittele dokumentit
    let documentsWithContent = [];

    if (documents && documents.length > 0) {
      console.log(`Fetching content for ${documents.length} documents`);

      // Apufunktio dokumentin sisällön hakemiseen Supabase parhaiden käytäntöjen mukaisesti
      async function getDocumentContent(supabase: any, documentId: string) {
        try {
          // 1. Hae metatiedot
          const { data: docMetadata, error: metadataError } = await supabase
            .from('company_documents')
            .select('*')
            .eq('id', documentId)
            .single();

          if (metadataError) {
            console.error(`Error fetching document metadata for ID ${documentId}:`, metadataError);
            return null;
          }

          if (!docMetadata || !docMetadata.file_path) {
            console.warn(`Document ${documentId} has no valid metadata or file_path`);
            return null;
          }

          // 2. Siisti tiedostopolku (poista etummainen kauttaviiva jos on)
          const cleanPath = docMetadata.file_path.startsWith('/') 
            ? docMetadata.file_path.substring(1) 
            : docMetadata.file_path;

          console.log(`Downloading document ${documentId} (${docMetadata.name}) from 'company-files' bucket, path: "${cleanPath}"`);

          // 3. Hae tiedosto Storagesta
          const { data, error: downloadError } = await supabase.storage
            .from('company-files')
            .download(cleanPath);

          if (downloadError) {
            console.error(`Storage error for document ${documentId}:`, downloadError);

            // Kokeile vielä polkua, joka on vain tiedostonimi
            if (cleanPath.includes('/')) {
              const justFileName = cleanPath.split('/').pop();
              console.log(`Trying with just filename: "${justFileName}"`);

              const fallbackResult = await supabase.storage
                .from('company-files')
                .download(justFileName);

              if (fallbackResult.error) {
                console.error(`Fallback attempt also failed:`, fallbackResult.error);
                return null;
              }

              console.log(`Fallback download succeeded with filename ${justFileName}`);
              return processContent(docMetadata, fallbackResult.data);
            }

            return null;
          }

          // 4. Prosessoi data onnistuneen latauksen jälkeen
          return processContent(docMetadata, data);
        } catch (e) {
          console.error(`Unexpected error processing document ${documentId}:`, e);
          return null;
        }
      }

      // Apufunktio sisällön käsittelyyn
      function processContent(docMetadata: any, data: any) {
        try {
          const enhancedDoc = { ...docMetadata };

          if (docMetadata.file_type?.startsWith('text/') || 
              docMetadata.file_type?.includes('json') || 
              docMetadata.file_type?.includes('csv')) {
            // Tekstimuotoinen dokumentti
            const text = data.text();
            enhancedDoc.content = text;
            console.log(`Loaded text content for document ${docMetadata.name}, length: ${text.length} chars`);
          } else {
            // Binäärimuotoinen dokumentti (PDF ym.)
            const arrayBuffer = data.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < uint8Array.byteLength; i++) {
              binary += String.fromCharCode(uint8Array[i]);
            }
            enhancedDoc.base64 = btoa(binary);
            enhancedDoc.mime_type = docMetadata.file_type || 'application/octet-stream';
            console.log(`Loaded binary content for document ${docMetadata.name}`);
          }

          return enhancedDoc;
        } catch (error) {
          console.error(`Error processing content:`, error);
          return null;
        }
      }

      // Hae kaikki dokumentit rinnakkain
      const documentPromises = documents.map(doc => getDocumentContent(supabase, doc.id));
      const results = await Promise.all(documentPromises);

      // Suodata pois null-arvot (epäonnistuneet lataukset)
      documentsWithContent = results.filter(Boolean);

      console.log(`Successfully loaded content for ${documentsWithContent.length}/${documents.length} documents`);
    }

    return { documents: documentsWithContent, error: null };
  } catch (error) {
    console.error("Error in fetchDocuments:", error);
    return { documents: [], error: error instanceof Error ? error.message : "Tuntematon virhe" };
  }
}