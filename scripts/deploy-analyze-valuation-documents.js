
// Supabase functions deployment script for analyze-valuation-documents function
import { execSync } from 'child_process';

// Supabase projektin tunniste
const PROJECT_REF = 'rmkleyyzieacwltcbgzs';

console.log(`\n🚀 Deployataan analyze-valuation-documents funktio projektiin ${PROJECT_REF}...\n`);

try {
  // Run the deployment command directly with npx
  const command = `npx supabase@beta functions deploy analyze-valuation-documents --use-api --project-ref ${PROJECT_REF} --debug`;
  console.log(`Suoritetaan komento: ${command}`);
  
  execSync(command, { 
    stdio: 'inherit' 
  });
  
  console.log(`\n✅ analyze-valuation-documents funktio deployattu onnistuneesti!`);
} catch (error) {
  console.error(`\n❌ Virhe analyze-valuation-documents funktion deployauksessa:`);
  console.error(error);
  process.exit(1);
}
