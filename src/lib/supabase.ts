import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase config:', { 
  url: supabaseUrl ? 'SET' : 'MISSING', 
  key: supabaseAnonKey ? 'SET' : 'MISSING' 
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseAnonKey);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true 
  }
});

// Test database connection and permissions
Promise.all([
  supabase.from('companies').select('count', { count: 'exact', head: true }),
  supabase.from('bills').select('count', { count: 'exact', head: true }),
  supabase.from('memos').select('count', { count: 'exact', head: true }),
  supabase.from('loading_slips').select('count', { count: 'exact', head: true }),
  supabase.from('parties').select('count', { count: 'exact', head: true }),
  supabase.from('suppliers').select('count', { count: 'exact', head: true }),
  supabase.from('vehicles').select('count', { count: 'exact', head: true })
]).then(results => {
  const tableStatus = {
    companies: results[0].error ? '❌' : '✅',
    bills: results[1].error ? '❌' : '✅', 
    memos: results[2].error ? '❌' : '✅',
    loading_slips: results[3].error ? '❌' : '✅',
    parties: results[4].error ? '❌' : '✅',
    suppliers: results[5].error ? '❌' : '✅',
    vehicles: results[6].error ? '❌' : '✅'
  };
  
  console.log('📊 Database Table Status:', tableStatus);
  
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    console.error('❌ Permission/RLS issues detected:', errors.map(e => e.error));
    console.error('❌ This is why data is not syncing - check RLS policies');
  } else {
    console.log('✅ All tables accessible - data sync should work!');
  }
});