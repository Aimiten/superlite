
// Supabase functions deployment script for generate-dd-tasks function
import { execSync } from 'child_process';

// Supabase projektin tunniste
const PROJECT_REF = 'rmkleyyzieacwltcbgzs';

console.log(`\n🚀 Deployataan generate-dd-tasks funktio projektiin ${PROJECT_REF}...\n`);

try {
  // Run the deployment command directly with npx
  const command = `npx supabase@beta functions deploy generate-dd-tasks --use-api --project-ref ${PROJECT_REF} --debug`;
  console.log(`Suoritetaan komento: ${command}`);
  
  execSync(command, { 
    stdio: 'inherit' 
  });
  
  console.log(`\n✅ generate-dd-tasks funktio deployattu onnistuneesti!`);
} catch (error) {
  console.error(`\n❌ Virhe generate-dd-tasks funktion deployauksessa:`);
  console.error(error);
  process.exit(1);
}
