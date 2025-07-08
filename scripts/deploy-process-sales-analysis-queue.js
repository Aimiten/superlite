
// Supabase functions deployment script for process-sales-analysis-queue function
import { execSync } from 'child_process';

// Supabase projektin tunniste
const PROJECT_REF = 'rmkleyyzieacwltcbgzs';

console.log(`\n🚀 Deployataan process-sales-analysis-queue funktio projektiin ${PROJECT_REF}...\n`);

try {
  // Run the deployment command directly with npx
  const command = `npx supabase@beta functions deploy process-sales-analysis-queue --use-api --project-ref ${PROJECT_REF} --debug`;
  console.log(`Suoritetaan komento: ${command}`);
  
  execSync(command, { 
    stdio: 'inherit' 
  });
  
  console.log(`\n✅ process-sales-analysis-queue funktio deployattu onnistuneesti!`);
} catch (error) {
  console.error(`\n❌ Virhe process-sales-analysis-queue funktion deployauksessa:`);
  console.error(error);
  process.exit(1);
}
