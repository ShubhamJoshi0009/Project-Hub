const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/authRoutes'));

const http = require('http');
const server = http.createServer(app);

server.listen(5099, async () => {
  console.log('Test server running on port 5099');

  const testEmail = `agent_test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Agent Test User';

  try {
    // 1. Test Register
    console.log('\n--- 1. Testing POST /api/auth/register ---');
    const regRes = await fetch('http://localhost:5099/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testName, email: testEmail, password: testPassword })
    });
    const regData = await regRes.json();
    console.log('Register Status:', regRes.status);
    console.log('Register Response:', { id: regData.id, name: regData.name, email: regData.email, token: regData.token ? 'JWT Present' : 'Missing' });

    if (regRes.status !== 201) throw new Error('Registration failed: ' + JSON.stringify(regData));

    // 2. Test Login
    console.log('\n--- 2. Testing POST /api/auth/login ---');
    const loginRes = await fetch('http://localhost:5099/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status);
    console.log('Login Response:', { id: loginData.id, name: loginData.name, email: loginData.email, token: loginData.token ? 'JWT Present' : 'Missing' });

    if (loginRes.status !== 200) throw new Error('Login failed: ' + JSON.stringify(loginData));

    // 3. Test Auth Me
    console.log('\n--- 3. Testing GET /api/auth/me ---');
    const meRes = await fetch('http://localhost:5099/api/auth/me', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    const meData = await meRes.json();
    console.log('Me Status:', meRes.status);
    console.log('Me User Profile:', { id: meData.id, name: meData.name, email: meData.email });

    if (meRes.status !== 200) throw new Error('Auth me failed: ' + JSON.stringify(meData));

    // Clean up
    const supabase = require('./supabaseClient');
    await supabase.auth.admin.deleteUser(regData.id);
    await supabase.from('profiles').delete().eq('id', regData.id);
    console.log('\n🧹 Test user cleaned up.');

    console.log('\n🎉 ALL AUTH ENDPOINTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Auth API test failed:', err);
  } finally {
    server.close();
  }
});
