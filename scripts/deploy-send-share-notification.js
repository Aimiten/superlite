import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function deployFunction() {
  try {
    console.log('🚀 Deploying send-share-notification function...');
    
    const { stdout, stderr } = await execAsync(
      'npx supabase functions deploy send-share-notification --project-ref uicgfgujtpradmkksqtx',
      { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
    );
    
    if (stderr && !stderr.includes('Successfully deployed')) {
      console.error('Stderr:', stderr);
    }
    
    console.log('Stdout:', stdout);
    console.log('✅ Function deployed successfully!');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

deployFunction();