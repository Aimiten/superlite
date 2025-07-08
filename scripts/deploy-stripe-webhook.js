// Supabase functions deployment script for stripe-webhook function
import { execSync } from 'child_process';

// Supabase projektin tunniste
const PROJECT_REF = 'rmkleyyzieacwltcbgzs';

console.log(`\n🚀 Deployataan stripe-webhook funktio projektiin ${PROJECT_REF}...\n`);

try {
  // Run the deployment command directly with npx
  const command = `npx supabase@beta functions deploy stripe-webhook --use-api --project-ref ${PROJECT_REF} --debug`;
  console.log(`Suoritetaan komento: ${command}`);

  execSync(command, { 
    stdio: 'inherit' 
  });

  console.log(`\n✅ stripe-webhook funktio deployattu onnistuneesti!`);
} catch (error) {
  console.error(`\n❌ Virhe stripe-webhook funktion deployauksessa:`);
  console.error(error);
  process.exit(1);
}