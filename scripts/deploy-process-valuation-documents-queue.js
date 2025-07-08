
// Supabase functions deployment script for process-valuation-documents-queue function
import { execSync } from 'child_process';

// Supabase projektin tunniste
const PROJECT_REF = 'rmkleyyzieacwltcbgzs';

console.log(`\n🚀 Deployataan process-valuation-documents-queue funktio projektiin ${PROJECT_REF}...\n`);

try {
  // Run the deployment command directly with npx
  const command = `npx supabase@beta functions deploy process-valuation-documents-queue --use-api --project-ref ${PROJECT_REF} --debug`;
  console.log(`Suoritetaan komento: ${command}`);
  
  execSync(command, { 
    stdio: 'inherit' 
  });
  
  console.log(`\n✅ process-valuation-documents-queue funktio deployattu onnistuneesti!`);
} catch (error) {
  console.error(`\n❌ Virhe process-valuation-documents-queue funktion deployauksessa:`);
  console.error(error);
  process.exit(1);
}
