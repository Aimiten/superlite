#!/usr/bin/env node

import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lataa ympäristömuuttujat
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const FUNCTION_NAME = 'reset-user-data';

console.log(`🚀 Deploying ${FUNCTION_NAME} function...`);

try {
  // Deploy the function
  const command = `supabase functions deploy ${FUNCTION_NAME} --no-verify-jwt`;
  
  console.log(`Running: ${command}`);
  execSync(command, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log(`✅ ${FUNCTION_NAME} function deployed successfully!`);
  
} catch (error) {
  console.error(`❌ Failed to deploy ${FUNCTION_NAME} function:`, error);
  process.exit(1);
}