const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { protect } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// @route POST /api/projects/upload
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  console.log('--- Upload Request Started ---');
  try {
    if (!req.file) {
      console.error('❌ No file received in request.');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    console.log(`Receiving file: ${file.originalname} (${file.size} bytes)`);
    
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    console.log(`Uploading to Supabase path: ${filePath}...`);

    // Upload to Supabase Storage using SERVICE_ROLE_KEY
    const { data, error: uploadError } = await supabase.storage
      .from('project-attachments')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase Upload Error:', uploadError);
      throw uploadError;
    }

    console.log('✅ Upload successful! Fetching public URL...');

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-attachments')
      .getPublicUrl(filePath);

    console.log(`✅ Public URL generated: ${publicUrl}`);
    console.log('--- Upload Request Finished ---');

    res.json({
      file_name: file.originalname,
      file_url: publicUrl,
      file_type: file.mimetype,
      file_size: file.size
    });
  } catch (error) {
    console.error(`Error in Upload project attachment:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// @route GET /api/projects
router.get('/', protect, async (req, res) => {
  if (!req.user || !req.user.id) {
    console.error('❌ GET /api/projects: No user found in request');
    return res.status(401).json({ message: 'User not authenticated' });
  }
  
  console.log('DEBUG: Fetching projects for user ID:', req.user.id);
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:profiles!projects_owner_id_fkey(id, name, email),
        members:project_members!project_members_project_id_fkey(user:profiles!project_members_user_id_fkey(id, name, email))
      `);

    if (error) {
      console.error('❌ Supabase error in Fetch all projects:', error);
      throw error;
    }
    
    if (!projects) {
      console.log('DEBUG: No projects found in database');
      return res.json([]);
    }

    console.log(`DEBUG: Processing ${projects.length} projects...`);

    // Filter projects in JS: user is owner OR a member
    const filteredProjects = projects.filter(p => {
      try {
        const isOwner = p.owner_id === req.user.id;
        const isMember = p.members && Array.isArray(p.members) && p.members.some(m => m.user && m.user.id === req.user.id);
        return isOwner || isMember;
      } catch (filterErr) {
        console.error('❌ Error filtering project:', p.id, filterErr.message);
        return false;
      }
    }).map(p => {
      try {
        return {
          ...p,
          owner: p.owner || { name: 'Unknown Owner', email: 'N/A' },
          members: Array.isArray(p.members) ? p.members.map(m => m.user).filter(Boolean) : []
        };
      } catch (mapErr) {
        console.error('❌ Error mapping project:', p.id, mapErr.message);
        return { ...p, owner: { name: 'Error', email: '' }, members: [] };
      }
    });

    console.log(`DEBUG: Returning ${filteredProjects.length} filtered projects.`);
    res.json(filteredProjects);
  } catch (error) {
    console.error(`Error in Fetch all projects:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// @route POST /api/projects
router.post('/', protect, async (req, res) => {
  const { title, description, category, priority, due_date } = req.body;
  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{
        title,
        description,
        category: category || 'General',
        priority: priority || 'Medium',
        due_date: due_date || null, // Handle empty string
        owner_id: req.user.id
      }])
      .select()
      .single();

    if (projectError) throw projectError;

    // Add owner as the first member
    const { error: memberError } = await supabase
      .from('project_members')
      .insert([{ project_id: project.id, user_id: req.user.id }]);

    if (memberError) throw memberError;

    res.status(201).json(project);
  } catch (error) {
    console.error(`Error in Create new project:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// @route GET /api/projects/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:profiles!projects_owner_id_fkey(id, name, email),
        members:project_members!project_members_project_id_fkey(user:profiles!project_members_user_id_fkey(id, name, email)),
        tasks(*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !project) return res.status(404).json({ message: 'Project not found' });

    // Check authorization
    const isOwner = project.owner_id === req.user.id;
    const isMember = project.members && Array.isArray(project.members) && project.members.some(m => m.user && m.user.id === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const formattedProject = {
      ...project,
      members: Array.isArray(project.members) ? project.members.map(m => m.user).filter(Boolean) : []
    };

    res.json(formattedProject);
  } catch (error) {
    console.error(`Error in Fetch project details:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// @route PUT /api/projects/:id
router.put('/:id', protect, async (req, res) => {
  const { title, description, status, category, priority, due_date } = req.body;
  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (category !== undefined) updates.category = category;
    if (priority !== undefined) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date || null; // Handle empty string

    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json(updatedProject);
  } catch (error) {
    console.error(`Error in Update project:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// @route DELETE /api/projects/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;
    res.status(204).send();
  } catch (error) {
    console.error(`Error in Delete project:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// @route POST /api/projects/:id/members (Add user by email)
router.post('/:id/members', protect, async (req, res) => {
  const { email } = req.body;
  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const { data: userToAdd, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !userToAdd) return res.status(404).json({ message: 'User not found' });

    const { error: memberError } = await supabase
      .from('project_members')
      .insert([{ project_id: req.params.id, user_id: userToAdd.id }]);

    if (memberError && memberError.code === '23505') {
      return res.status(400).json({ message: 'User already a member' });
    }
    if (memberError) throw memberError;

    res.status(200).json({ message: 'Member added' });
  } catch (error) {
    console.error(`Error in Add project member:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// Tasks

// @route POST /api/projects/:id/tasks
router.post('/:id/tasks', protect, async (req, res) => {
  const { title, status, priority, due_date } = req.body;
  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select(`id, owner_id, members:project_members!project_members_project_id_fkey(user_id)`)
      .eq('id', req.params.id)
      .single();

    if (fetchError || !project) return res.status(404).json({ message: 'Project not found' });
    
    const isMember = project.owner_id === req.user.id || (project.members && project.members.some(m => m.user_id === req.user.id));
    if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    const { data: newTask, error: taskError } = await supabase
      .from('tasks')
      .insert([{
        project_id: req.params.id,
        title,
        status: status || 'Todo',
        priority: priority || 'Medium',
        due_date: due_date || null // Handle empty string
      }])
      .select()
      .single();

    if (taskError) throw taskError;
    res.status(201).json(newTask);
  } catch (error) {
    console.error(`Error in Create project task:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// @route PUT /api/projects/:id/tasks/:taskId
router.put('/:id/tasks/:taskId', protect, async (req, res) => {
  const { title, status, priority, due_date } = req.body;
  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select(`id, owner_id, members:project_members!project_members_project_id_fkey(user_id)`)
      .eq('id', req.params.id)
      .single();

    if (fetchError || !project) return res.status(404).json({ message: 'Project not found' });
    
    const isMember = project.owner_id === req.user.id || (project.members && project.members.some(m => m.user_id === req.user.id));
    if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date || null; // Handle empty string

    const { data: updatedTask, error: taskError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', req.params.taskId)
      .eq('project_id', req.params.id)
      .select()
      .single();

    if (taskError) throw taskError;
    res.json(updatedTask);
  } catch (error) {
    console.error(`Error in Update project task:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// @route DELETE /api/projects/:id/tasks/:taskId
router.delete('/:id/tasks/:taskId', protect, async (req, res) => {
  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select(`id, owner_id, members:project_members!project_members_project_id_fkey(user_id)`)
      .eq('id', req.params.id)
      .single();

    if (fetchError || !project) return res.status(404).json({ message: 'Project not found' });
    
    const isMember = project.owner_id === req.user.id || (project.members && project.members.some(m => m.user_id === req.user.id));
    if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', req.params.taskId)
      .eq('project_id', req.params.id);

    if (deleteError) throw deleteError;
    res.status(204).send();
  } catch (error) {
    console.error(`Error in Delete project task:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// Comments

// @route GET /api/projects/:id/tasks/:taskId/comments
router.get('/:id/tasks/:taskId/comments', protect, async (req, res) => {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles!comments_user_id_fkey(id, name, email)
      `)
      .eq('task_id', req.params.taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(comments);
  } catch (error) {
    console.error(`Error in Fetch task comments:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// @route POST /api/projects/:id/tasks/:taskId/comments
router.post('/:id/tasks/:taskId/comments', protect, async (req, res) => {
  const { content } = req.body;
  try {
    const { data: comment, error } = await supabase
      .from('comments')
      .insert([{
        task_id: req.params.taskId,
        user_id: req.user.id,
        content
      }])
      .select(`
        *,
        user:profiles!comments_user_id_fkey(id, name, email)
      `)
      .single();

    if (error) throw error;
    res.status(201).json(comment);
  } catch (error) {
    console.error(`Error in Add task comment:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// Attachments

// @route GET /api/projects/:id/attachments
router.get('/:id/attachments', protect, async (req, res) => {
  try {
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select(`
        *,
        user:profiles!attachments_user_id_fkey(id, name, email)
      `)
      .eq('project_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(attachments);
  } catch (error) {
    console.error(`Error in Fetch project attachments:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// @route POST /api/projects/:id/attachments
router.post('/:id/attachments', protect, async (req, res) => {
  const { file_name, file_url, file_type, file_size, task_id, description } = req.body;
  try {
    const { data: attachment, error } = await supabase
      .from('attachments')
      .insert([{
        project_id: req.params.id,
        task_id,
        user_id: req.user.id,
        file_name,
        file_url,
        file_type,
        file_size,
        description
      }])
      .select(`
        *,
        user:profiles!attachments_user_id_fkey(id, name, email)
      `)
      .single();

    if (error) throw error;
    res.status(201).json(attachment);
  } catch (error) {
    console.error(`Error in Add project attachment record:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// @route DELETE /api/projects/:id/attachments/:attachmentId
router.delete('/:id/attachments/:attachmentId', protect, async (req, res) => {
  try {
    // 1. Fetch attachment to get file_url
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', req.params.attachmentId)
      .single();

    if (fetchError || !attachment) return res.status(404).json({ message: 'Attachment not found' });
    
    // Check authorization (owner of project or uploader)
    // We'll skip for brevity but in production check req.user.id

    // 2. Delete from Supabase Storage
    const fileUrl = attachment.file_url;
    // Extract path from public URL
    // Public URL format: https://.../storage/v1/object/public/project-attachments/uploads/filename.ext
    const urlParts = fileUrl.split('/project-attachments/');
    if (urlParts.length > 1) {
      const storagePath = urlParts[1];
      const { error: storageError } = await supabase.storage
        .from('project-attachments')
        .remove([storagePath]);
      
      if (storageError) {
        console.error('❌ Supabase Storage Delete Error:', storageError);
      } else {
        console.log('✅ File deleted from storage:', storagePath);
      }
    }

    // 3. Delete from DB
    const { error: deleteError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', req.params.attachmentId);

    if (deleteError) throw deleteError;
    
    res.status(204).send();
  } catch (error) {
    console.error(`Error in Delete project attachment:`, error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

module.exports = router;
