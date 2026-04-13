const supabase = require('./supabaseClient');

async function testProjectsQuery() {
  const userId = '4972d84c-1d6d-4468-b886-31e9f0d96e9d';
  console.log(`Testing full projects query for user: ${userId}`);

  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:profiles!projects_owner_id_fkey(id, name, email),
        members:project_members(
          user:profiles!project_members_user_id_fkey(id, name, email)
        )
      `)
      .or(`owner_id.eq.${userId}`); // Simple OR first

    if (error) {
      console.error('❌ Supabase Query Error:', error);
    } else {
      console.log('✅ Query successful!');
      console.log('Projects count:', projects.length);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testProjectsQuery();
