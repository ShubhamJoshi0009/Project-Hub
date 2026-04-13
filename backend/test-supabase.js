const supabase = require('./supabaseClient');

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
  console.log('Key:', process.env.SUPABASE_KEY ? 'Set' : 'Missing');

  try {
    // Attempt to fetch from profiles table (should exist if SQL setup was run)
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "profiles" does not exist')) {
        console.log('✅ Connection successful, but "profiles" table not found.');
        console.log('👉 Make sure to run the SQL setup script (supabase_setup.sql) in your Supabase SQL Editor.');
      } else {
        console.error('❌ Supabase error:', error.message);
      }
    } else {
      console.log('✅ Connection successful! Supabase is working correctly.');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testConnection();
