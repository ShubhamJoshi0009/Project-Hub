const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (authError) {
      return res.status(400).json({ message: authError.message });
    }

    const userId = authData.user.id;

    // Create profile in our custom profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: userId, name, email }])
      .select()
      .single();

    if (profileError) {
      return res.status(400).json({ message: profileError.message });
    }

    res.status(201).json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      token: generateToken(profile.id),
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const userId = authData.user.id;

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select()
    .eq('id', userId)
    .single();

  if (profileError) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  res.json({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    token: generateToken(profile.id),
  });
});

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
