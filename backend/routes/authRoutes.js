const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

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

    const userId = authData.user?.id;
    if (!userId) {
      return res.status(400).json({ message: 'User registration failed. Please try again.' });
    }

    // Create or update profile in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert([{ id: userId, name, email }], { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      console.error('Profile Upsert Error:', profileError);
      return res.status(400).json({ message: profileError.message });
    }

    res.status(201).json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      job_title: profile.job_title,
      phone: profile.phone,
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

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

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
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  res.json({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    job_title: profile.job_title,
    phone: profile.phone,
    token: generateToken(profile.id),
  });
});

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// @route PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio, job_title, phone, avatar_url } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (job_title !== undefined) updates.job_title = job_title;
    if (phone !== undefined) updates.phone = phone;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    updates.updated_at = new Date().toISOString();

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedProfile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message || 'Failed to update profile' });
  }
});

// @route POST /api/auth/avatar
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const filePath = `avatars/${req.user.id}-${Date.now()}.${fileExt}`;

    // Upload to avatars or project-attachments bucket
    const bucketName = 'project-attachments';
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Save avatar_url to profile
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select()
      .single();

    if (profileError) throw profileError;

    res.json({ avatar_url: publicUrl, profile: updatedProfile });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload avatar' });
  }
});

// @route GET /api/auth/users
router.get('/users', protect, async (req, res) => {
  try {
    const searchQuery = req.query.q ? req.query.q.toLowerCase() : '';
    let query = supabase
      .from('profiles')
      .select('id, name, email, avatar_url, job_title')
      .neq('id', req.user.id)
      .limit(20);

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    const { data: users, error } = await query;
    if (error) throw error;

    res.json(users || []);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch users' });
  }
});

// ==============================================================================
// Notifications Endpoints
// ==============================================================================

// @route GET /api/auth/notifications
router.get('/notifications', protect, async (req, res) => {
  try {
    const { data: notifs, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      // Return empty array if notifications table not yet migrated
      return res.json([]);
    }

    res.json(notifs || []);
  } catch (err) {
    res.json([]);
  }
});

// @route PUT /api/auth/notifications/:id/read
router.put('/notifications/:id/read', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// @route PUT /api/auth/notifications/read-all
router.put('/notifications/read-all', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
});

// @route DELETE /api/auth/notifications/:id
router.delete('/notifications/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

module.exports = router;


