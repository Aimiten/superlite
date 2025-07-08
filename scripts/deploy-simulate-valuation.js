
import { execSync } from 'child_process';

// Supabase projektin tunniste
const PROJECT_REF = 'rmkleyyzieacwltcbgzs';

console.log('🚀 Deploying simulate-valuation function...');

try {
  // Deploy the function with project-ref to avoid interactive selection
  const command = `npx supabase@beta functions deploy simulate-valuation --use-api --project-ref ${PROJECT_REF} --no-verify-jwt`;
  console.log(`Running command: ${command}`);
  
  execSync(command, {
    stdio: 'inherit'
  });
  
  console.log('✅ simulate-valuation function deployed successfully!');
} catch (error) {
  console.error('❌ Error deploying simulate-valuation function:', error.message);
  process.exit(1);
}
