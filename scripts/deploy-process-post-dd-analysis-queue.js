
// Supabase functions deployment script for process-post-dd-analysis-queue function
import { execSync } from 'child_process';

// Supabase projektin tunniste
const PROJECT_REF = 'rmkleyyzieacwltcbgzs';

console.log(`\n🚀 Deployataan process-post-dd-analysis-queue funktio projektiin ${PROJECT_REF}...\n`);

try {
  // Run the deployment command directly with npx
  const command = `npx supabase@beta functions deploy process-post-dd-analysis-queue --use-api --project-ref ${PROJECT_REF} --debug`;
  console.log(`Suoritetaan komento: ${command}`);
  
  execSync(command, { 
    stdio: 'inherit' 
  });
  
  console.log(`\n✅ process-post-dd-analysis-queue funktio deployattu onnistuneesti!`);
} catch (error) {
  console.error(`\n❌ Virhe process-post-dd-analysis-queue funktion deployauksessa:`);
  console.error(error);
  process.exit(1);
}
