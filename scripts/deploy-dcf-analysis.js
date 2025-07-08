const { execSync } = require('child_process');

console.log('Deploying DCF Scenario Analysis function...');

try {
  // Deploy the dcf-scenario-analysis function
  execSync('supabase functions deploy dcf-scenario-analysis', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ DCF Scenario Analysis function deployed successfully');
} catch (error) {
  console.error('❌ Failed to deploy DCF Scenario Analysis function:', error.message);
  process.exit(1);
}