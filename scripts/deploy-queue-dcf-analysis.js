
// Supabase functions deployment script for queue-dcf-analysis function
import { execSync } from 'child_process';

// Supabase projektin tunniste
const PROJECT_REF = 'rmkleyyzieacwltcbgzs';

console.log(`\n🚀 Deployataan queue-dcf-analysis funktio projektiin ${PROJECT_REF}...\n`);

try {
  // Run the deployment command directly with npx
  const command = `npx supabase@beta functions deploy queue-dcf-analysis --use-api --project-ref ${PROJECT_REF} --debug`;
  console.log(`Suoritetaan komento: ${command}`);
  
  execSync(command, { 
    stdio: 'inherit' 
  });
  
  console.log(`\n✅ queue-dcf-analysis funktio deployattu onnistuneesti!`);
} catch (error) {
  console.error(`\n❌ Virhe queue-dcf-analysis funktion deployauksessa:`);
  console.error(error);
  process.exit(1);
}
