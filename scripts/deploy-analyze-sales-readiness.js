
// Supabase functions deployment script for analyze-sales-readiness function
import { execSync } from 'child_process';

// Supabase projektin tunniste
const PROJECT_REF = 'rmkleyyzieacwltcbgzs';

console.log(`\n🚀 Deployataan analyze-sales-readiness funktio projektiin ${PROJECT_REF}...\n`);

try {
  // Run the deployment command directly with npx
  const command = `npx supabase@beta functions deploy analyze-sales-readiness --use-api --project-ref ${PROJECT_REF} --debug`;
  console.log(`Suoritetaan komento: ${command}`);
  
  execSync(command, { 
    stdio: 'inherit' 
  });
  
  console.log(`\n✅ analyze-sales-readiness funktio deployattu onnistuneesti!`);
} catch (error) {
  console.error(`\n❌ Virhe analyze-sales-readiness funktion deployauksessa:`);
  console.error(error);
  process.exit(1);
}
