// supabase/functions/analyze-sales-readiness/data/data-service.ts

import { organizeTasks } from "./task-organizer.ts";

// getDocumentContent-funktio poistettu koska company_documents ei enää tarvita

export async function fetchCompanyData(supabase: any, companyId: string) 
{
  console.log(`Fetching comprehensive data for company: ${companyId}`);

  try {
    // Hae kaikki tarvittavat tiedot rinnakkain
    const [
      companyResult,
      companyInfoResult,
      tasksResult,
      assessmentResult,
      valuationResult,
      analysisResult
    ] = await Promise.all([
      // Perustiedot
      supabase.from("companies").select("*").eq("id",
companyId).single(),

      // Lisäinfot (sisältää SWOT-tiedot ym.)
      supabase.from("company_info").select("*").eq("company_id",
companyId).single(),

      // Tehtävät vastauksineen
      supabase.from("company_tasks")
        .select(`*, task_responses(*)`)
        .eq("company_id", companyId),

      // Viimeisin arviointi (sisältää kyselyvastaukset)
      supabase.from("assessments")
        .select("*")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single(),

      // Viimeisin valuaatio (lopputulos)
      supabase.from("valuations")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),

      // Viimeisin valuation-analyysi (raakadata)
      supabase.from("valuation_document_analysis")
        .select("financial_analysis")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
    ]);

    // Tarkista pakolliset tiedot
    if (companyResult.error || !companyResult.data) {
      throw new Error(`Yritystä ei löydy: ${companyResult.error?.message 
|| "Tuntematon virhe"}`);
    }

    if (tasksResult.error || !tasksResult.data) {
      throw new Error(`Tehtävien haku epäonnistui: 
${tasksResult.error?.message || "Tuntematon virhe"}`);
    }

    // Log-viestit tulosten tarkistamiseksi
    console.log(`Company data loaded: ${companyResult.data.name}`);
    console.log(`Tasks loaded: ${tasksResult.data.length}`);
    console.log(`Company info present: ${companyInfoResult.data ? 'Yes' :
 'No'}`);
    console.log(`Assessment present: ${assessmentResult.data ? 'Yes' : 
'No'}`);
    console.log(`Valuation present: ${valuationResult.data ? 'Yes' : 
'No'}`);
    console.log(`Financial analysis present: ${analysisResult.data ? 'Yes' : 
'No'}`);

    const tasks = tasksResult.data || [];
    const completedTasks = tasks.filter(t => t.completion_status ===
"completed");
    const completionRate = tasks.length > 0 ? completedTasks.length /
tasks.length : 0;

    // Järjestä tehtävät kategorioittain
    const organizedTasks = organizeTasks(tasks);
    console.log("organizeTasks completed, moving to file processing");

    // Käsittele task-vastauksissa olevat tiedostot
    console.log("Processing task responses for file attachments...");
    for (const task of tasks) {
      if (task.value?.filePath && task.value?.fileName) {
        try {
          console.log(`Loading task file: ${task.value.fileName} from 
path: ${task.value.filePath}`);

          // Lataa tiedosto task-files bucketista
          const { data, error } = await supabase.storage
            .from('task-files')
            .download(task.value.filePath);

          if (error) {
            console.error(`Error downloading task file 
${task.value.fileName}:`, error);
            console.error(`Full error details:`, JSON.stringify(error, null, 2));
            continue;
          }
          
          console.log(`Successfully downloaded file: ${task.value.fileName}, size: ${data?.size || 'unknown'}`);
          
          if (!data) {
            console.error(`No data returned for file: ${task.value.fileName}`);
            continue;
          }

          // Tarkista tiedostotyyppi
          if (task.value.fileType?.includes('pdf')) {
            // PDF-tiedosto - muunna base64-muotoon
            const arrayBuffer = await data.arrayBuffer();
            const base64 = btoa(
              new Uint8Array(arrayBuffer)
                .reduce((data, byte) => data + String.fromCharCode(byte),
 '')
            );

            // Lisää tiedoston sisältö task-objektiin (Gemini-yhteensopiva muoto)
            task.fileContent = {
              base64: base64,
              mime_type: task.value.fileType,
              name: task.value.fileName,
              document_type: 'task_attachment'
            };
            console.log(`Loaded PDF content for task ${task.id}, 
${base64.length} base64 chars`);
          } else if (task.value.fileType?.startsWith('text/')) {
            // Tekstitiedosto
            const text = await data.text();
            task.fileContent = {
              content: text,
              name: task.value.fileName,
              document_type: 'task_attachment'
            };
            console.log(`Loaded text content for task ${task.id}, 
${text.length} chars`);
          }
        } catch (error) {
          console.error(`Error processing task file for task 
${task.id}:`, error);
        }
      }
    }

    // Task-dokumentit ovat nyt ainoa dokumenttilähde (company_documents poistettu)

    return {
      companyData: companyResult.data,
      companyInfo: companyInfoResult.data || null,
      tasks,
      organizedTasks,
      assessmentData: assessmentResult.error ? null :
assessmentResult.data,
      valuationData: valuationResult.error ? null : valuationResult.data,
      financialAnalysisData: analysisResult.error ? null : analysisResult.data,
      documents: [], // Ei enää company_documents, vain task-dokumentit
      completionRate
    };
  } catch (error) {
    console.error("Error fetching company data:", error);
    throw error;
  }
}