const supabase = require('./supabaseClient');

async function debugUser() {
  const email = 'joshishubham2109@gmail.com';
  console.log(`Debugging user: ${email}`);

  try {
    // 1. Check if user exists in auth.users (requires service role key)
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error listing users:', authError.message);
    } else {
      const user = users.find(u => u.email === email);
      if (user) {
        console.log('✅ User found in auth.users:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Confirmed At: ${user.email_confirmed_at}`);
      } else {
        console.log('❌ User NOT found in auth.users.');
      }
    }

    // 2. Check if user exists in public.profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log('❌ Profile NOT found in public.profiles.');
      } else {
        console.error('Error fetching profile:', profileError.message);
      }
    } else {
      console.log('✅ Profile found in public.profiles:');
      console.log(`   ID: ${profile.id}`);
      console.log(`   Name: ${profile.name}`);
    }

  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

debugUser();
