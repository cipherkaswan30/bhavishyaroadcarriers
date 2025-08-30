import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Supabase config:', { 
  url: supabaseUrl ? 'SET' : 'MISSING', 
  key: supabaseAnonKey ? 'SET' : 'MISSING' 
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Please click "Connect to Supabase" in the top right to set up your database connection.');
}

// Create a mock client if environment variables are missing
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { 
        persistSession: true, 
        autoRefreshToken: true, 
        detectSessionInUrl: true 
      }
    })
  : null;

// Only run tests if supabase client is available
if (supabase) {
  // Test if tables actually exist and what columns they have
  const testTableStructure = async () => {
    console.log('🔍 Testing table structure...');
    
    try {
      // Check if bills table exists and what columns it has
      const { data, error } = await supabase.rpc('get_table_info', { table_name: 'bills' });
      
      if (error) {
        console.log('⚠️ RPC failed, trying direct table access...');
        
        // Try a simple select to see what happens
        const { data: simpleData, error: simpleError } = await supabase
          .from('bills')
          .select('*')
          .limit(1);
          
        console.log('📊 Simple select result:', { data: simpleData, error: simpleError });
        
        // Try inserting with minimal data
        const { data: insertData, error: insertError } = await supabase
          .from('bills')
          .insert({
            number: 1,
            freight: 100
          })
          .select();
          
        console.log('📊 Insert test result:', { data: insertData, error: insertError });
        
      } else {
        console.log('✅ Table info:', data);
      }
      
    } catch (error) {
      console.error('❌ Table structure test failed:', error);
    }
  };

  // Run test after a short delay
  setTimeout(testTableStructure, 2000);
}