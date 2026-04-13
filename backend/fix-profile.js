const supabase = require('./supabaseClient');

async function fixProfile() {
  const email = 'joshishubham2109@gmail.com';
  const name = 'joshishubham';
  const id = '4972d84c-1d6d-4468-b886-31e9f0d96e9d';

  console.log(`Fixing profile for user: ${email}`);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ id, name, email }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating profile:', error.message);
    } else {
      console.log('✅ Profile successfully created for:', email);
      console.log('👉 You can now log in directly!');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

fixProfile();
