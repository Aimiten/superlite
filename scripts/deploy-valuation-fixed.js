
// Supabase functions deploy script for valuation function only
import { execSync } from 'child_process';

// Supabase projektin tunniste
const PROJECT_REF = 'rmkleyyzieacwltcbgzs';

console.log(`\n🚀 Deploying valuation function to project ${PROJECT_REF}...\n`);

try {
  // Run the deployment command directly with npx
  // Skip global installation attempt entirely
  const command = `npx supabase@beta functions deploy valuation --use-api --project-ref ${PROJECT_REF} --debug`;
  console.log(`Running command: ${command}`);
  
  execSync(command, { 
    stdio: 'inherit' 
  });
  
  console.log(`\n✅ Valuation function deployed successfully!`);
} catch (error) {
  console.error(`\n❌ Error deploying valuation function:`);
  console.error(error);
  process.exit(1);
}
