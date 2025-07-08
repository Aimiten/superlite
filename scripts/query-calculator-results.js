import { createClient } from '@supabase/supabase-js';

// Read environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getLatestCalculatorResults() {
  try {
    const { data, error } = await supabase
      .from('free_calculator_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Latest 10 records from free_calculator_results:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error querying database:', err);
  }
}

getLatestCalculatorResults();