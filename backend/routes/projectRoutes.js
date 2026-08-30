const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const multer = require('multer');
const supabase = require('../supabaseClient');
const { protect } = require('../middleware/authMiddleware');

// Configure multer for file uploads (up to 20MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

// Helper: Log Project Activity
const logActivity = async (projectId, userId, action, details = {}) => {
  try {
    await supabase.from('activities').insert([{
      project_id: projectId,
      user_id: userId,
      action,
      details
    }]);
  } catch (err) {
    console.warn('Activity Log Warning (Ignored):', err.message);
  }
};

// Helper: Create In-App Notification
const createNotification = async (userId, title, message, type = 'info', link = null) => {
  try {
    await supabase.from('notifications').insert([{
      user_id: userId,
      title,
      message,
      type,
      link,
      is_read: false
    }]);
  } catch (err) {
    console.warn('Notification Warning (Ignored):', err.message);
  }
};

// Helper: Automated Workflow Engine
const runProjectAutomations = async (projectId, triggerEvent, context = {}) => {
  try {
    const { data: automations, error } = await supabase
      .from('project_automations')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true);

    if (error || !automations || automations.length === 0) return;

    // Match matching trigger events (support exact match or generic)
    const matchingAutos = automations.filter(a => {
      if (a.trigger_event === triggerEvent) return true;
      if (triggerEvent === 'status_changed_to_done' && a.trigger_event === 'status_changed') return true;
      return false;
    });

    for (const auto of matchingAutos) {
      if (auto.action_type === 'move_status' && context.taskId) {
        const targetStatus = auto.action_payload?.target_status || 'Done';
        await supabase
          .from('tasks')
          .update({ status: targetStatus, updated_at: new Date().toISOString() })
          .eq('id', context.taskId);
      } else if (auto.action_type === 'assign_user' && context.taskId && auto.action_payload?.user_id) {
        await supabase
          .from('tasks')
          .update({ assigned_to: auto.action_payload.user_id, updated_at: new Date().toISOString() })
          .eq('id', context.taskId);
      } else if (auto.action_type === 'assign_owner' && context.taskId) {
        const { data: proj } = await supabase.from('projects').select('owner_id').eq('id', projectId).single();
        if (proj?.owner_id) {
          await supabase
            .from('tasks')
            .update({ assigned_to: proj.owner_id, updated_at: new Date().toISOString() })
            .eq('id', context.taskId);
        }
      } else if (auto.action_type === 'notify_team') {
        const msg = auto.action_payload?.message || `Automation triggered: ${auto.name}`;
        const { data: members } = await supabase
          .from('project_members')
          .select('user_id')
          .eq('project_id', projectId);

        if (members && members.length > 0) {
          const notifs = members.map(m => ({
            user_id: m.user_id,
            title: `Automation: ${auto.name}`,
            message: msg,
            type: 'automation',
            link: `/projects/${projectId}`
          }));
          await supabase.from('notifications').insert(notifs);
        }
      }

      // Increment execution count
      await supabase
        .from('project_automations')
        .update({ execution_count: (auto.execution_count || 0) + 1 })
        .eq('id', auto.id);
    }
  } catch (err) {
    console.warn('Automation execution warning:', err.message);
  }
};

// Preset Templates
const TEMPLATES = {
  software_sprint: {
    tasks: [
      { title: 'System Architecture & DB Design', status: 'Done', priority: 'High', tags: 'Architecture', subtasks: ['Design ERD Diagrams', 'Define Postgres RLS Policies', 'Setup Supabase Schemas'] },
      { title: 'Backend REST API & Auth Services', status: 'In Progress', priority: 'High', tags: 'Backend', subtasks: ['JWT Middleware', 'Multer Storage Uploads', 'Audit Event Triggers'] },
      { title: 'Interactive Kanban & Dual View', status: 'In Review', priority: 'High', tags: 'Frontend', subtasks: ['Drag and drop columns', 'Filter by assignee', 'Responsive drawer modal'] },
      { title: 'Automated QA & Performance Testing', status: 'Todo', priority: 'Medium', tags: 'QA', subtasks: ['Vite bundle audit', 'Edge case error handling'] },
      { title: 'Production CI/CD Deployment', status: 'Todo', priority: 'Medium', tags: 'DevOps', subtasks: ['Domain DNS config', 'SSL Certification'] }
    ],
    doc: {
      title: 'Sprint Planning & Technical Specs',
      category: 'Architecture',
      content: '# Sprint Deliverables & Technical Specs\n\n### Sprint Goals\n- Deliver real-time Kanban board with instant drag & drop.\n- Complete Supabase PostgreSQL schema with strict Row Level Security (RLS).\n- Implement role-based permissions and activity audit streams.\n\n### Key Deliverables\n1. Real-time collaboration.\n2. Checklist subtasks tracking.\n3. Public shareable project showcase.'
    }
  },
  product_launch: {
    tasks: [
      { title: 'Market Research & Competitor Benchmarks', status: 'Done', priority: 'High', tags: 'Research', subtasks: ['Competitor feature audit', 'User persona validation'] },
      { title: 'Finalize MVP Feature Matrix', status: 'Done', priority: 'High', tags: 'Product', subtasks: ['Scope freeze', 'Release criteria'] },
      { title: 'High-Converting Landing Page Design', status: 'In Progress', priority: 'High', tags: 'Design', subtasks: ['Hero wireframe', 'Interactive demo visual'] },
      { title: 'Early Beta Testing Program', status: 'Todo', priority: 'Medium', tags: 'Beta', subtasks: ['Invite 50 founders', 'Feedback survey setup'] },
      { title: 'Press Release & Product Hunt Launch', status: 'Todo', priority: 'High', tags: 'Marketing', subtasks: ['Teaser video', 'Maker comment preparation'] }
    ],
    doc: {
      title: 'Product Launch Roadmap & GTM Strategy',
      category: 'Product',
      content: '# Go-to-Market (GTM) Strategy\n\n### Value Proposition\nNext-generation project management for high-velocity teams.\n\n### Target Audience\nTech startups, agencies, software engineering teams, and freelancers.'
    }
  },
  bug_tracker: {
    tasks: [
      { title: 'Investigate session token timeout on Safari', status: 'In Progress', priority: 'High', tags: 'Bug, Auth', subtasks: ['Reproduce on iOS', 'Check cookie samesite flag'] },
      { title: 'Resolve mobile responsive navbar clipping', status: 'Todo', priority: 'Medium', tags: 'Bug, UI', subtasks: ['Adjust z-index', 'Test breakpoint @768px'] },
      { title: 'Optimize database index on projects search', status: 'Todo', priority: 'Low', tags: 'Performance', subtasks: ['Add GIN index on tags', 'Benchmark query time'] }
    ],
    doc: {
      title: 'Bug Triage & Severity Guidelines',
      category: 'QA',
      content: '# Bug Triage Guidelines\n\n- **P0 Critical**: System down, data loss, security vulnerability.\n- **P1 High**: Major feature broken without workaround.\n- **P2 Medium**: Minor feature glitch with simple workaround.\n- **P3 Low**: Cosmetic or typo issues.'
    }
  },
  design_system: {
    tasks: [
      { title: 'Color Tokens & Dark Palette Definition', status: 'Done', priority: 'High', tags: 'Design', subtasks: ['Primary Emerald', 'Neutral Slate scales', 'Contrast ratio 4.5:1'] },
      { title: 'Button, Input & Badge UI Components', status: 'In Progress', priority: 'High', tags: 'Components', subtasks: ['States: Hover, Active, Focus, Disabled'] },
      { title: 'Modal, Drawer & Toast Animation Patterns', status: 'In Review', priority: 'Medium', tags: 'Animations', subtasks: ['Framer spring curves', 'Backdrop blur balance'] },
      { title: 'Storybook Documentation & Accessibility Audit', status: 'Todo', priority: 'Low', tags: 'Accessibility', subtasks: ['Keyboard navigation', 'ARIA label tagging'] }
    ],
    doc: {
      title: 'Design System Foundations & Tokens',
      category: 'Design',
      content: '# Design System Foundations\n\n### Core Philosophy\nClean, minimalist, high-contrast dark aesthetic with vibrant emerald and slate accents.'
    }
  },
  marketing: {
    tasks: [
      { title: 'Q3 Content Calendar & Blog Outlines', status: 'Done', priority: 'Medium', tags: 'Content', subtasks: ['5 SEO pillar articles', 'Social snippets'] },
      { title: 'Social Media Banner Assets & Promo Video', status: 'In Progress', priority: 'High', tags: 'Assets', subtasks: ['Twitter/X headers', '15s motion teaser'] },
      { title: 'Email Drip Sequence Setup', status: 'Todo', priority: 'Medium', tags: 'Email', subtasks: ['Welcome email', 'Day 3 activation tip'] },
      { title: 'Google Analytics & Conversion Funnel Tagging', status: 'Todo', priority: 'High', tags: 'Analytics', subtasks: ['Custom events', 'UTM campaign parameters'] }
    ],
    doc: {
      title: 'Campaign Brief & Conversion Funnel',
      category: 'Marketing',
      content: '# Marketing Campaign Brief\n\n### Objective\nGenerate 500+ signups in the first month through organic SEO and community outreach.'
    }
  }
};

// ==============================================================================
// 1. File Upload (Supabase Storage)
// ==============================================================================
// @route POST /api/projects/upload
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedName}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('project-attachments')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('project-attachments')
      .getPublicUrl(filePath);

    res.json({
      file_name: file.originalname,
      file_url: publicUrl,
      file_type: file.mimetype,
      file_size: file.size
    });
  } catch (error) {
    console.error('Error in Upload project attachment:', error);
    res.status(500).json({ message: error.message || 'File upload failed' });
  }
});

// ==============================================================================
// 2. Projects CRUD
// ==============================================================================

// @route GET /api/projects
router.get('/', protect, async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:profiles!projects_owner_id_fkey(id, name, email, avatar_url),
        members:project_members!project_members_project_id_fkey(
          role,
          joined_at,
          user:profiles!project_members_user_id_fkey(id, name, email, avatar_url, job_title)
        ),
        tasks(id, status, priority, due_date, assigned_to, estimated_hours, actual_hours)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error in Fetch all projects:', error);
      throw error;
    }
    
    if (!projects) {
      return res.json([]);
    }

    // Filter projects: user is owner OR a member
    const filteredProjects = projects.filter(p => {
      const isOwner = p.owner_id === req.user.id;
      const isMember = p.members && Array.isArray(p.members) && p.members.some(m => m.user && m.user.id === req.user.id);
      return isOwner || isMember;
    }).map(p => ({
      ...p,
      owner: p.owner || { name: 'Unknown Owner', email: 'N/A' },
      members: Array.isArray(p.members) ? p.members.map(m => ({
        ...(m.user || {}),
        role: m.role || 'member',
        joined_at: m.joined_at
      })).filter(u => u.id) : []
    }));

    res.json(filteredProjects);
  } catch (error) {
    console.error('Error in Fetch all projects:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch projects' });
  }
});

// @route POST /api/projects
router.post('/', protect, async (req, res) => {
  const { title, description, category, priority, due_date, color, budget, tags, template } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Project title is required' });
  }

  try {
    const shareToken = crypto.randomBytes(16).toString('hex');

    const insertPayload = {
      title,
      description: description || '',
      category: category || 'General',
      priority: priority || 'Medium',
      due_date: due_date || null,
      color: color || '#10b981',
      budget: budget ? Number(budget) : null,
      tags: tags || '',
      owner_id: req.user.id,
      share_token: shareToken,
      is_public: false
    };

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([insertPayload])
      .select()
      .single();

    if (projectError) throw projectError;

    // Add owner as owner member in project_members
    await supabase
      .from('project_members')
      .insert([{ project_id: project.id, user_id: req.user.id, role: 'owner' }]);

    // Pre-populate template tasks and docs if requested
    if (template && TEMPLATES[template]) {
      const tpl = TEMPLATES[template];
      for (const t of tpl.tasks) {
        const { data: createdTask } = await supabase
          .from('tasks')
          .insert([{
            project_id: project.id,
            title: t.title,
            status: t.status || 'Todo',
            priority: t.priority || 'Medium',
            tags: t.tags || '',
            assigned_to: req.user.id
          }])
          .select()
          .single();

        if (createdTask && t.subtasks && Array.isArray(t.subtasks)) {
          const subtaskInserts = t.subtasks.map(st => ({
            task_id: createdTask.id,
            title: st,
            is_completed: t.status === 'Done'
          }));
          await supabase.from('subtasks').insert(subtaskInserts);
        }
      }

      if (tpl.doc) {
        await supabase.from('project_docs').insert([{
          project_id: project.id,
          user_id: req.user.id,
          title: tpl.doc.title,
          category: tpl.doc.category,
          content: tpl.doc.content
        }]);
      }
    }

    await logActivity(project.id, req.user.id, 'created_project', { title: project.title, template: template || 'custom' });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error in Create new project:', error);
    res.status(500).json({ message: error.message || 'Failed to create project' });
  }
});

// @route GET /api/projects/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:profiles!projects_owner_id_fkey(id, name, email, avatar_url, job_title),
        members:project_members!project_members_project_id_fkey(
          role,
          joined_at,
          user:profiles!project_members_user_id_fkey(id, name, email, avatar_url, job_title, phone)
        ),
        tasks(
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, name, email, avatar_url),
          subtasks(*)
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !project) {
      // Fallback query
      const { data: fallbackProj, error: fbError } = await supabase
        .from('projects')
        .select(`
          *,
          owner:profiles!projects_owner_id_fkey(id, name, email, avatar_url),
          members:project_members!project_members_project_id_fkey(user:profiles!project_members_user_id_fkey(id, name, email, avatar_url)),
          tasks(*)
        `)
        .eq('id', req.params.id)
        .single();

      if (fbError || !fallbackProj) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const isOwner = fallbackProj.owner_id === req.user.id;
      const isMember = fallbackProj.members && Array.isArray(fallbackProj.members) && fallbackProj.members.some(m => m.user && m.user.id === req.user.id);
      if (!isOwner && !isMember) return res.status(403).json({ message: 'Not authorized' });

      return res.json({
        ...fallbackProj,
        members: Array.isArray(fallbackProj.members) ? fallbackProj.members.map(m => m.user).filter(Boolean) : []
      });
    }

    const isOwner = project.owner_id === req.user.id;
    const isMember = project.members && Array.isArray(project.members) && project.members.some(m => m.user && m.user.id === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    const formattedProject = {
      ...project,
      members: Array.isArray(project.members) ? project.members.map(m => ({
        ...(m.user || {}),
        role: m.role || (m.user?.id === project.owner_id ? 'owner' : 'member'),
        joined_at: m.joined_at
      })).filter(u => u.id) : []
    };

    res.json(formattedProject);
  } catch (error) {
    console.error('Error in Fetch project details:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch project' });
  }
});

// @route PUT /api/projects/:id
router.put('/:id', protect, async (req, res) => {
  const { title, description, status, category, priority, due_date, color, budget, tags } = req.body;
  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('owner_id, title')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner_id !== req.user.id) return res.status(403).json({ message: 'Not authorized to edit this project' });

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (category !== undefined) updates.category = category;
    if (priority !== undefined) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date || null;
    if (color !== undefined) updates.color = color;
    if (budget !== undefined) updates.budget = budget ? Number(budget) : null;
    if (tags !== undefined) updates.tags = tags;

    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    await logActivity(req.params.id, req.user.id, 'updated_project', updates);

    res.json(updatedProject);
  } catch (error) {
    console.error('Error in Update project:', error);
    res.status(500).json({ message: error.message || 'Failed to update project' });
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
    if (project.owner_id !== req.user.id) return res.status(403).json({ message: 'Not authorized to delete this project' });

    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;
    res.status(204).send();
  } catch (error) {
    console.error('Error in Delete project:', error);
    res.status(500).json({ message: error.message || 'Failed to delete project' });
  }
});

// ==============================================================================
// 3. Project Members Management
// ==============================================================================

// @route GET /api/projects/:id/members
router.get('/:id/members', protect, async (req, res) => {
  try {
    const { data: members, error } = await supabase
      .from('project_members')
      .select(`
        role,
        joined_at,
        user:profiles!project_members_user_id_fkey(id, name, email, avatar_url, job_title, phone)
      `)
      .eq('project_id', req.params.id);

    if (error) throw error;
    res.json((members || []).map(m => ({ ...(m.user || {}), role: m.role, joined_at: m.joined_at })));
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch members' });
  }
});

// @route POST /api/projects/:id/members (Add user by email)
router.post('/:id/members', protect, async (req, res) => {
  const { email, role = 'member' } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('owner_id, title')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner_id !== req.user.id) return res.status(403).json({ message: 'Only project owners can invite members' });

    const { data: userToAdd, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (userError || !userToAdd) {
      return res.status(404).json({ message: `No user account found with email "${email}"` });
    }

    const { error: memberError } = await supabase
      .from('project_members')
      .insert([{ project_id: req.params.id, user_id: userToAdd.id, role }]);

    if (memberError && memberError.code === '23505') {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }
    if (memberError) throw memberError;

    await logActivity(req.params.id, req.user.id, 'added_member', { member_name: userToAdd.name, member_email: userToAdd.email, role });

    // Send in-app notification to invited user
    await createNotification(
      userToAdd.id,
      'Project Invitation',
      `${req.user.name || 'A team member'} added you to project "${project.title}" as ${role}`,
      'join',
      `/projects/${req.params.id}`
    );

    res.status(200).json({ message: 'Member added successfully', user: userToAdd });
  } catch (error) {
    console.error('Error in Add project member:', error);
    res.status(500).json({ message: error.message || 'Failed to add member' });
  }
});

// @route PUT /api/projects/:id/members/:userId (Update member role)
router.put('/:id/members/:userId', protect, async (req, res) => {
  const { role } = req.body;
  try {
    const { data: project } = await supabase.from('projects').select('owner_id').eq('id', req.params.id).single();
    if (!project || project.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Only project owners can update roles' });
    }

    const { error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('project_id', req.params.id)
      .eq('user_id', req.params.userId);

    if (error) throw error;
    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update member role' });
  }
});

// @route DELETE /api/projects/:id/members/:userId (Remove member or leave)
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const { data: project } = await supabase.from('projects').select('owner_id').eq('id', req.params.id).single();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwner = project.owner_id === req.user.id;
    const isSelf = req.params.userId === req.user.id;

    if (!isOwner && !isSelf) {
      return res.status(403).json({ message: 'Not authorized to remove this member' });
    }

    if (isOwner && isSelf) {
      return res.status(400).json({ message: 'Project owner cannot leave. Delete or transfer the project instead.' });
    }

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', req.params.id)
      .eq('user_id', req.params.userId);

    if (error) throw error;

    await logActivity(req.params.id, req.user.id, isSelf ? 'left_project' : 'removed_member', { user_id: req.params.userId });

    res.status(200).json({ message: isSelf ? 'Left project' : 'Member removed' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to remove member' });
  }
});

// ==============================================================================
// 4. Tasks Management
// ==============================================================================

// @route POST /api/projects/:id/tasks
router.post('/:id/tasks', protect, async (req, res) => {
  const { 
    title, description, status, priority, due_date, start_date, 
    assigned_to, tags, order_index, estimated_hours, actual_hours,
    recurrence, depends_on, custom_fields, story_points 
  } = req.body;

  if (!title) return res.status(400).json({ message: 'Task title is required' });

  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select(`id, title, owner_id, members:project_members!project_members_project_id_fkey(user_id)`)
      .eq('id', req.params.id)
      .single();

    if (fetchError || !project) return res.status(404).json({ message: 'Project not found' });
    
    const isMember = project.owner_id === req.user.id || (project.members && project.members.some(m => m.user_id === req.user.id));
    if (!isMember) return res.status(403).json({ message: 'Not authorized to add tasks' });

    const taskPayload = {
      project_id: req.params.id,
      title,
      description: description || '',
      status: status || 'Todo',
      priority: priority || 'Medium',
      due_date: due_date || null,
      start_date: start_date || null,
      assigned_to: assigned_to || null,
      tags: tags || '',
      order_index: order_index || 0,
      estimated_hours: estimated_hours !== undefined && estimated_hours !== null && estimated_hours !== '' ? Number(estimated_hours) : 0,
      actual_hours: actual_hours !== undefined && actual_hours !== null && actual_hours !== '' ? Number(actual_hours) : 0,
      recurrence: recurrence || 'none',
      depends_on: depends_on || null,
      custom_fields: custom_fields || {},
      story_points: story_points || 1
    };

    const { data: newTask, error: taskError } = await supabase
      .from('tasks')
      .insert([taskPayload])
      .select(`
        *,
        assigned_user:profiles!tasks_assigned_to_fkey(id, name, email, avatar_url)
      `)
      .single();

    if (taskError) {
      // Fallback without extended fields/relations
      const { data: basicTask, error: bError } = await supabase
        .from('tasks')
        .insert([{
          project_id: req.params.id,
          title,
          status: status || 'Todo',
          priority: priority || 'Medium',
          due_date: due_date || null
        }])
        .select()
        .single();
      
      if (bError) throw bError;
      await logActivity(req.params.id, req.user.id, 'created_task', { title: basicTask.title });
      return res.status(201).json(basicTask);
    }

    await logActivity(req.params.id, req.user.id, 'created_task', { title: newTask.title, status: newTask.status, priority: newTask.priority });

    // In-app Notification for assigned user
    if (assigned_to && assigned_to !== req.user.id) {
      await createNotification(
        assigned_to,
        'Task Assigned',
        `${req.user.name || 'A team member'} assigned you to task "${title}" in ${project.title}`,
        'assignment',
        `/projects/${req.params.id}`
      );
    }

    // Trigger Automations
    if (priority === 'High') {
      await runProjectAutomations(req.params.id, 'high_priority_created', { taskId: newTask.id, title });
    }

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error in Create project task:', error);
    res.status(500).json({ message: error.message || 'Failed to create task' });
  }
});

// @route PUT /api/projects/:id/tasks/:taskId
router.put('/:id/tasks/:taskId', protect, async (req, res) => {
  const { 
    title, description, status, priority, due_date, start_date, 
    assigned_to, tags, order_index, estimated_hours, actual_hours,
    recurrence, depends_on, custom_fields, story_points 
  } = req.body;

  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select(`id, title, owner_id, members:project_members!project_members_project_id_fkey(user_id)`)
      .eq('id', req.params.id)
      .single();

    if (fetchError || !project) return res.status(404).json({ message: 'Project not found' });
    
    const isMember = project.owner_id === req.user.id || (project.members && project.members.some(m => m.user_id === req.user.id));
    if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    // Fetch existing task to compare state changes
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('status, assigned_to, title')
      .eq('id', req.params.taskId)
      .single();

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date || null;
    if (start_date !== undefined) updates.start_date = start_date || null;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
    if (tags !== undefined) updates.tags = tags;
    if (order_index !== undefined) updates.order_index = order_index;
    if (estimated_hours !== undefined) updates.estimated_hours = estimated_hours ? Number(estimated_hours) : 0;
    if (actual_hours !== undefined) updates.actual_hours = actual_hours ? Number(actual_hours) : 0;
    if (recurrence !== undefined) updates.recurrence = recurrence;
    if (depends_on !== undefined) updates.depends_on = depends_on || null;
    if (custom_fields !== undefined) updates.custom_fields = custom_fields;
    if (story_points !== undefined) updates.story_points = story_points;

    const { data: updatedTask, error: taskError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', req.params.taskId)
      .eq('project_id', req.params.id)
      .select(`
        *,
        assigned_user:profiles!tasks_assigned_to_fkey(id, name, email, avatar_url),
        subtasks(*)
      `)
      .single();

    if (taskError) {
      // Fallback basic update
      const { data: fbTask, error: fbError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', req.params.taskId)
        .eq('project_id', req.params.id)
        .select()
        .single();

      if (fbError) throw fbError;
      if (status) await logActivity(req.params.id, req.user.id, 'updated_task_status', { title: fbTask.title, status });
      return res.json(fbTask);
    }

    if (status && status !== existingTask?.status) {
      await logActivity(req.params.id, req.user.id, 'updated_task_status', { title: updatedTask.title, status });
      
      // Trigger status-change automations
      await runProjectAutomations(req.params.id, 'status_changed', { taskId: updatedTask.id, status });
      if (status === 'Done') {
        await runProjectAutomations(req.params.id, 'status_changed_to_done', { taskId: updatedTask.id });
      }
    }

    // Check if newly assigned to another user
    if (assigned_to && assigned_to !== existingTask?.assigned_to && assigned_to !== req.user.id) {
      await createNotification(
        assigned_to,
        'Task Assigned',
        `${req.user.name || 'A team member'} assigned you to task "${updatedTask.title}" in ${project.title}`,
        'assignment',
        `/projects/${req.params.id}`
      );
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error in Update project task:', error);
    res.status(500).json({ message: error.message || 'Failed to update task' });
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

    await logActivity(req.params.id, req.user.id, 'deleted_task', { task_id: req.params.taskId });

    res.status(204).send();
  } catch (error) {
    console.error('Error in Delete project task:', error);
    res.status(500).json({ message: error.message || 'Failed to delete task' });
  }
});

// ==============================================================================
// 5. Subtasks / Checklist Items
// ==============================================================================

// @route GET /api/projects/:id/tasks/:taskId/subtasks
router.get('/:id/tasks/:taskId/subtasks', protect, async (req, res) => {
  try {
    const { data: subtasks, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', req.params.taskId)
      .order('created_at', { ascending: true });

    if (error) return res.json([]);
    res.json(subtasks || []);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch subtasks' });
  }
});

// @route POST /api/projects/:id/tasks/:taskId/subtasks
router.post('/:id/tasks/:taskId/subtasks', protect, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Subtask title required' });

  try {
    const { data: subtask, error } = await supabase
      .from('subtasks')
      .insert([{ task_id: req.params.taskId, title, is_completed: false }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(subtask);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create subtask' });
  }
});

// @route PUT /api/projects/:id/tasks/:taskId/subtasks/:subtaskId
router.put('/:id/tasks/:taskId/subtasks/:subtaskId', protect, async (req, res) => {
  const { title, is_completed } = req.body;
  try {
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (is_completed !== undefined) updates.is_completed = is_completed;

    const { data: subtask, error } = await supabase
      .from('subtasks')
      .update(updates)
      .eq('id', req.params.subtaskId)
      .select()
      .single();

    if (error) throw error;

    // Check if all subtasks are completed for this task
    if (is_completed === true) {
      const { data: allSubtasks } = await supabase
        .from('subtasks')
        .select('is_completed')
        .eq('task_id', req.params.taskId);

      if (allSubtasks && allSubtasks.length > 0 && allSubtasks.every(s => s.is_completed)) {
        await runProjectAutomations(req.params.id, 'all_subtasks_done', { taskId: req.params.taskId });
      }
    }

    res.json(subtask);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update subtask' });
  }
});

// @route DELETE /api/projects/:id/tasks/:taskId/subtasks/:subtaskId
router.delete('/:id/tasks/:taskId/subtasks/:subtaskId', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', req.params.subtaskId);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete subtask' });
  }
});

// ==============================================================================
// 6. Time Logs (Live Timer & Manual Time Tracking)
// ==============================================================================

// @route GET /api/projects/:id/tasks/:taskId/timelogs
router.get('/:id/tasks/:taskId/timelogs', protect, async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('time_logs')
      .select(`
        *,
        user:profiles!time_logs_user_id_fkey(id, name, email, avatar_url)
      `)
      .eq('task_id', req.params.taskId)
      .order('created_at', { ascending: false });

    if (error) {
      const { data: basicLogs } = await supabase
        .from('time_logs')
        .select('*')
        .eq('task_id', req.params.taskId)
        .order('created_at', { ascending: false });

      return res.json(basicLogs || []);
    }

    res.json(logs || []);
  } catch (err) {
    res.json([]);
  }
});

// @route POST /api/projects/:id/tasks/:taskId/timelogs
router.post('/:id/tasks/:taskId/timelogs', protect, async (req, res) => {
  const { duration_minutes, description, logged_date } = req.body;
  if (!duration_minutes || isNaN(duration_minutes) || Number(duration_minutes) <= 0) {
    return res.status(400).json({ message: 'Valid duration in minutes is required' });
  }

  const mins = Number(duration_minutes);

  try {
    const { data: log, error } = await supabase
      .from('time_logs')
      .insert([{
        task_id: req.params.taskId,
        user_id: req.user.id,
        duration_minutes: mins,
        description: description || 'Logged time',
        logged_date: logged_date || new Date().toISOString().split('T')[0]
      }])
      .select(`
        *,
        user:profiles!time_logs_user_id_fkey(id, name, email, avatar_url)
      `)
      .single();

    let createdLog = log;

    if (error || !createdLog) {
      const { data: basicLog, error: bError } = await supabase
        .from('time_logs')
        .insert([{
          task_id: req.params.taskId,
          user_id: req.user.id,
          duration_minutes: mins,
          description: description || 'Logged time',
          logged_date: logged_date || new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (bError) throw bError;
      createdLog = basicLog;
    }

    // Update actual_hours on the task
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('actual_hours, title')
      .eq('id', req.params.taskId)
      .single();

    if (currentTask) {
      const newActual = Number(((Number(currentTask.actual_hours) || 0) + (mins / 60)).toFixed(2));
      await supabase
        .from('tasks')
        .update({ actual_hours: newActual, updated_at: new Date().toISOString() })
        .eq('id', req.params.taskId);
    }

    await logActivity(req.params.id, req.user.id, 'logged_time', {
      task_id: req.params.taskId,
      minutes: mins,
      description
    });

    res.status(201).json(createdLog);
  } catch (err) {
    console.error('Error logging time:', err);
    res.status(500).json({ message: err.message || 'Failed to log time' });
  }
});

// @route DELETE /api/projects/:id/tasks/:taskId/timelogs/:logId
router.delete('/:id/tasks/:taskId/timelogs/:logId', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('time_logs')
      .delete()
      .eq('id', req.params.logId)
      .eq('task_id', req.params.taskId);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete time log' });
  }
});

// ==============================================================================
// 7. Comments
// ==============================================================================

// @route GET /api/projects/:id/tasks/:taskId/comments
router.get('/:id/tasks/:taskId/comments', protect, async (req, res) => {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles!comments_user_id_fkey(id, name, email, avatar_url)
      `)
      .eq('task_id', req.params.taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(comments || []);
  } catch (error) {
    console.error('Error in Fetch task comments:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch comments' });
  }
});

// @route POST /api/projects/:id/tasks/:taskId/comments
router.post('/:id/tasks/:taskId/comments', protect, async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ message: 'Comment content cannot be empty' });

  try {
    const { data: comment, error } = await supabase
      .from('comments')
      .insert([{
        task_id: req.params.taskId,
        user_id: req.user.id,
        content: content.trim()
      }])
      .select(`
        *,
        user:profiles!comments_user_id_fkey(id, name, email, avatar_url)
      `)
      .single();

    if (error) throw error;

    await logActivity(req.params.id, req.user.id, 'added_comment', {
      task_id: req.params.taskId,
      preview: content.length > 50 ? `${content.substring(0, 47)}...` : content
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error in Add task comment:', error);
    res.status(500).json({ message: error.message || 'Failed to add comment' });
  }
});

// @route DELETE /api/projects/:id/tasks/:taskId/comments/:commentId
router.delete('/:id/tasks/:taskId/comments/:commentId', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', req.params.commentId)
      .eq('task_id', req.params.taskId);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete comment' });
  }
});

// ==============================================================================
// 8. Attachments
// ==============================================================================

// @route GET /api/projects/:id/attachments
router.get('/:id/attachments', protect, async (req, res) => {
  try {
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select(`
        *,
        user:profiles!attachments_user_id_fkey(id, name, email, avatar_url)
      `)
      .eq('project_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(attachments || []);
  } catch (error) {
    console.error('Error in Fetch project attachments:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch attachments' });
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
        task_id: task_id || null,
        user_id: req.user.id,
        file_name,
        file_url,
        file_type,
        file_size,
        description: description || ''
      }])
      .select(`
        *,
        user:profiles!attachments_user_id_fkey(id, name, email, avatar_url)
      `)
      .single();

    if (error) throw error;

    await logActivity(req.params.id, req.user.id, 'uploaded_attachment', { file_name });

    res.status(201).json(attachment);
  } catch (error) {
    console.error('Error in Add project attachment record:', error);
    res.status(500).json({ message: error.message || 'Failed to save attachment metadata' });
  }
});

// @route DELETE /api/projects/:id/attachments/:attachmentId
router.delete('/:id/attachments/:attachmentId', protect, async (req, res) => {
  try {
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', req.params.attachmentId)
      .single();

    if (fetchError || !attachment) return res.status(404).json({ message: 'Attachment not found' });

    // Delete from Supabase Storage if url contains project-attachments
    const fileUrl = attachment.file_url;
    const urlParts = fileUrl.split('/project-attachments/');
    if (urlParts.length > 1) {
      const storagePath = urlParts[1];
      await supabase.storage
        .from('project-attachments')
        .remove([storagePath]);
    }

    // Delete from DB
    const { error: deleteError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', req.params.attachmentId);

    if (deleteError) throw deleteError;
    
    await logActivity(req.params.id, req.user.id, 'deleted_attachment', { file_name: attachment.file_name });

    res.status(204).send();
  } catch (error) {
    console.error('Error in Delete project attachment:', error);
    res.status(500).json({ message: error.message || 'Failed to delete attachment' });
  }
});

// ==============================================================================
// 9. Project Activities (Audit Feed)
// ==============================================================================

// @route GET /api/projects/:id/activities
router.get('/:id/activities', protect, async (req, res) => {
  try {
    const { data: activities, error } = await supabase
      .from('activities')
      .select(`
        *,
        user:profiles!activities_user_id_fkey(id, name, email, avatar_url)
      `)
      .eq('project_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.json([]);
    }

    res.json(activities || []);
  } catch (error) {
    res.json([]);
  }
});

// ==============================================================================
// 10. Project Export (JSON & CSV)
// ==============================================================================

// @route GET /api/projects/:id/export
router.get('/:id/export', protect, async (req, res) => {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:profiles!projects_owner_id_fkey(id, name, email),
        members:project_members!project_members_project_id_fkey(user:profiles!project_members_user_id_fkey(name, email)),
        tasks(*),
        attachments(*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !project) return res.status(404).json({ message: 'Project not found' });

    const exportData = {
      title: project.title,
      description: project.description,
      status: project.status,
      category: project.category,
      priority: project.priority,
      due_date: project.due_date,
      owner: project.owner,
      members: project.members?.map(m => m.user) || [],
      tasks: project.tasks || [],
      attachments_count: project.attachments?.length || 0,
      exported_at: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${project.title.replace(/\s+/g, '_')}_export.json"`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Export failed' });
  }
});

// @route GET /api/projects/:id/export/csv
router.get('/:id/export/csv', protect, async (req, res) => {
  try {
    const { data: project } = await supabase
      .from('projects')
      .select(`*, tasks(*, assigned_user:profiles!tasks_assigned_to_fkey(name, email))`)
      .eq('id', req.params.id)
      .single();

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const headers = ['Task Title', 'Status', 'Priority', 'Due Date', 'Assignee', 'Tags', 'Estimated Hours', 'Actual Hours'];
    const rows = (project.tasks || []).map(t => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.status || 'Todo'}"`,
      `"${t.priority || 'Medium'}"`,
      `"${t.due_date || ''}"`,
      `"${t.assigned_user?.name || 'Unassigned'}"`,
      `"${t.tags || ''}"`,
      `"${t.estimated_hours || 0}"`,
      `"${t.actual_hours || 0}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${project.title.replace(/\s+/g, '_')}_tasks.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate CSV export' });
  }
});

// ==============================================================================
// 11. Public Project Sharing
// ==============================================================================

// @route PUT /api/projects/:id/share
router.put('/:id/share', protect, async (req, res) => {
  try {
    const { is_public } = req.body;
    let shareToken = req.body.share_token;

    if (is_public && !shareToken) {
      shareToken = crypto.randomBytes(16).toString('hex');
    }

    const { data: updated, error } = await supabase
      .from('projects')
      .update({ is_public: !!is_public, share_token: shareToken })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await logActivity(req.params.id, req.user.id, 'updated_project', { 
      action: is_public ? 'enabled public link sharing' : 'disabled public link sharing' 
    });

    res.json({ is_public: updated.is_public, share_token: updated.share_token });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update share settings' });
  }
});

// @route GET /api/projects/public/:shareToken (No auth required)
router.get('/public/:shareToken', async (req, res) => {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        id, title, description, category, priority, status, due_date, color, tags, is_public, share_token, created_at,
        owner:profiles!projects_owner_id_fkey(name, avatar_url, job_title),
        members:project_members!project_members_project_id_fkey(role, user:profiles!project_members_user_id_fkey(name, avatar_url, job_title)),
        tasks(id, title, description, status, priority, due_date, tags, order_index, estimated_hours, actual_hours, assigned_user:profiles!tasks_assigned_to_fkey(name, avatar_url), subtasks(id, title, is_completed)),
        attachments(id, file_name, file_url, file_size, file_type),
        project_docs(id, title, content, category, updated_at)
      `)
      .eq('share_token', req.params.shareToken)
      .eq('is_public', true)
      .single();

    if (error || !project) {
      return res.status(404).json({ message: 'Public project not found or sharing has been disabled.' });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load public project' });
  }
});

// ==============================================================================
// 12. Project Documentation & Wiki (Notion/Linear style)
// ==============================================================================

// @route GET /api/projects/:id/docs
router.get('/:id/docs', protect, async (req, res) => {
  try {
    const { data: docs, error } = await supabase
      .from('project_docs')
      .select(`*, user:profiles!project_docs_user_id_fkey(id, name, avatar_url)`)
      .eq('project_id', req.params.id)
      .order('updated_at', { ascending: false });

    if (error) return res.json([]);
    res.json(docs || []);
  } catch (err) {
    res.json([]);
  }
});

// @route POST /api/projects/:id/docs
router.post('/:id/docs', protect, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title) return res.status(400).json({ message: 'Doc title is required' });

    const { data: doc, error } = await supabase
      .from('project_docs')
      .insert([{
        project_id: req.params.id,
        user_id: req.user.id,
        title,
        content: content || '',
        category: category || 'General'
      }])
      .select(`*, user:profiles!project_docs_user_id_fkey(id, name, avatar_url)`)
      .single();

    if (error) throw error;
    await logActivity(req.params.id, req.user.id, 'created_doc', { title });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to create doc' });
  }
});

// @route PUT /api/projects/:id/docs/:docId
router.put('/:id/docs/:docId', protect, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (category !== undefined) updates.category = category;

    const { data: doc, error } = await supabase
      .from('project_docs')
      .update(updates)
      .eq('id', req.params.docId)
      .eq('project_id', req.params.id)
      .select(`*, user:profiles!project_docs_user_id_fkey(id, name, avatar_url)`)
      .single();

    if (error) throw error;
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update doc' });
  }
});

// @route DELETE /api/projects/:id/docs/:docId
router.delete('/:id/docs/:docId', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('project_docs')
      .delete()
      .eq('id', req.params.docId)
      .eq('project_id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete doc' });
  }
});

// ==============================================================================
// 13. Automated Workflows (Trigger-Action Engine)
// ==============================================================================

// @route GET /api/projects/:id/automations
router.get('/:id/automations', protect, async (req, res) => {
  try {
    const { data: autos, error } = await supabase
      .from('project_automations')
      .select('*')
      .eq('project_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) return res.json([]);
    res.json(autos || []);
  } catch (err) {
    res.json([]);
  }
});

// @route POST /api/projects/:id/automations
router.post('/:id/automations', protect, async (req, res) => {
  try {
    const { name, trigger_event, trigger_condition, action_type, action_payload } = req.body;
    if (!name || !trigger_event || !action_type) {
      return res.status(400).json({ message: 'Name, trigger, and action are required' });
    }

    const { data: auto, error } = await supabase
      .from('project_automations')
      .insert([{
        project_id: req.params.id,
        name,
        trigger_event,
        trigger_condition: trigger_condition || {},
        action_type,
        action_payload: action_payload || {},
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    await logActivity(req.params.id, req.user.id, 'created_automation', { name });
    res.status(201).json(auto);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to create automation' });
  }
});

// @route PUT /api/projects/:id/automations/:autoId
router.put('/:id/automations/:autoId', protect, async (req, res) => {
  try {
    const { is_active, name, action_type, action_payload } = req.body;
    const updates = {};
    if (is_active !== undefined) updates.is_active = is_active;
    if (name !== undefined) updates.name = name;
    if (action_type !== undefined) updates.action_type = action_type;
    if (action_payload !== undefined) updates.action_payload = action_payload;

    const { data: auto, error } = await supabase
      .from('project_automations')
      .update(updates)
      .eq('id', req.params.autoId)
      .eq('project_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(auto);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update automation' });
  }
});

// @route DELETE /api/projects/:id/automations/:autoId
router.delete('/:id/automations/:autoId', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('project_automations')
      .delete()
      .eq('id', req.params.autoId)
      .eq('project_id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete automation' });
  }
});

// ==============================================================================
// 14. Real-Time Project Team Chat
// ==============================================================================

// @route GET /api/projects/:id/chat
router.get('/:id/chat', protect, async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('project_chat_messages')
      .select(`*, user:profiles!project_chat_messages_user_id_fkey(id, name, avatar_url, job_title)`)
      .eq('project_id', req.params.id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) return res.json([]);
    res.json(messages || []);
  } catch (err) {
    res.json([]);
  }
});

// @route POST /api/projects/:id/chat
router.post('/:id/chat', protect, async (req, res) => {
  try {
    const { message, attachments } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const { data: newMsg, error } = await supabase
      .from('project_chat_messages')
      .insert([{
        project_id: req.params.id,
        user_id: req.user.id,
        message: message.trim(),
        attachments: attachments || []
      }])
      .select(`*, user:profiles!project_chat_messages_user_id_fkey(id, name, avatar_url, job_title)`)
      .single();

    if (error) throw error;
    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to send message' });
  }
});

// ==============================================================================
// 15. Audio Huddle / Conference Sessions
// ==============================================================================

// @route GET /api/projects/:id/huddle
router.get('/:id/huddle', protect, async (req, res) => {
  try {
    const { data: huddle } = await supabase
      .from('huddle_sessions')
      .select('*')
      .eq('project_id', req.params.id)
      .single();

    res.json(huddle || { is_active: false, active_participants: [] });
  } catch (err) {
    res.json({ is_active: false, active_participants: [] });
  }
});

// @route POST /api/projects/:id/huddle/join
router.post('/:id/huddle/join', protect, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('huddle_sessions')
      .select('*')
      .eq('project_id', req.params.id)
      .single();

    const participant = {
      id: req.user.id,
      name: req.user.name,
      avatar_url: req.user.avatar_url,
      joined_at: new Date().toISOString()
    };

    let participants = existing?.active_participants || [];
    if (!participants.some(p => p.id === req.user.id)) {
      participants.push(participant);
    }

    const { data: updated, error } = await supabase
      .from('huddle_sessions')
      .upsert([{
        project_id: req.params.id,
        active_participants: participants,
        is_active: true,
        updated_at: new Date().toISOString()
      }], { onConflict: 'project_id' })
      .select()
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to join huddle' });
  }
});

// @route POST /api/projects/:id/huddle/leave
router.post('/:id/huddle/leave', protect, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('huddle_sessions')
      .select('*')
      .eq('project_id', req.params.id)
      .single();

    if (!existing) return res.json({ is_active: false, active_participants: [] });

    const participants = (existing.active_participants || []).filter(p => p.id !== req.user.id);
    const isActive = participants.length > 0;

    const { data: updated, error } = await supabase
      .from('huddle_sessions')
      .update({
        active_participants: participants,
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updated || { is_active: false, active_participants: [] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to leave huddle' });
  }
});

// ==============================================================================
// 16. Webhooks & External Integrations
// ==============================================================================

// @route GET /api/projects/:id/integrations
router.get('/:id/integrations', protect, async (req, res) => {
  try {
    const { data: integrations, error } = await supabase
      .from('project_webhooks')
      .select('*')
      .eq('project_id', req.params.id);

    if (error) return res.json([]);
    res.json(integrations || []);
  } catch (err) {
    res.json([]);
  }
});

// @route POST /api/projects/:id/integrations
router.post('/:id/integrations', protect, async (req, res) => {
  try {
    const { service, webhook_url, secret, events } = req.body;
    if (!service) return res.status(400).json({ message: 'Service name is required' });

    const { data: integration, error } = await supabase
      .from('project_webhooks')
      .insert([{
        project_id: req.params.id,
        service,
        webhook_url: webhook_url || '',
        secret: secret || '',
        events: events || ['all'],
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(integration);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to save integration' });
  }
});

// @route DELETE /api/projects/:id/integrations/:integrationId
router.delete('/:id/integrations/:integrationId', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('project_webhooks')
      .delete()
      .eq('id', req.params.integrationId)
      .eq('project_id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete integration' });
  }
});

// @route POST /api/projects/:id/webhooks/:service (Webhook Receiver for GitHub, GitLab, Slack, Jira, etc.)
router.post('/:id/webhooks/:service', async (req, res) => {
  try {
    const service = req.params.service.toLowerCase();
    const event = req.headers['x-github-event'] || req.headers['x-gitlab-event'] || req.headers['x-event-key'] || 'generic';
    const payload = req.body;

    if (service === 'github' || service === 'gitlab') {
      const isPR = event === 'pull_request' || event === 'Merge Request Hook';
      const isMerged = payload.pull_request?.merged || payload.object_attributes?.state === 'merged';
      const prTitle = payload.pull_request?.title || payload.object_attributes?.title || '';

      if (isMerged) {
        await runProjectAutomations(req.params.id, 'pr_merged', { prTitle, service });
      }
    }

    res.status(200).json({ received: true, service, event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 17. Workload & Team Utilization Heatmap
// ==============================================================================

// @route GET /api/projects/:id/workload
router.get('/:id/workload', protect, async (req, res) => {
  try {
    const { data: project } = await supabase
      .from('projects')
      .select(`
        id, title, owner_id,
        owner:profiles!projects_owner_id_fkey(id, name, email, avatar_url, job_title),
        members:project_members!project_members_project_id_fkey(
          role,
          user:profiles!project_members_user_id_fkey(id, name, email, avatar_url, job_title)
        ),
        tasks(id, title, status, priority, estimated_hours, actual_hours, assigned_to)
      `)
      .eq('id', req.params.id)
      .single();

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const maxWeeklyHours = 40;
    const membersList = (project.members || []).map(m => m.user).filter(Boolean);
    
    // Ensure owner is included in the team list
    if (project.owner && !membersList.some(m => m.id === project.owner.id)) {
      membersList.unshift(project.owner);
    }

    const tasks = project.tasks || [];

    const workloadData = membersList.map(member => {
      const memberTasks = tasks.filter(t => t.assigned_to === member.id);
      const activeTasks = memberTasks.filter(t => t.status !== 'Done');
      const totalEstimated = activeTasks.reduce((sum, t) => sum + (Number(t.estimated_hours) || 4), 0);
      const totalLogged = memberTasks.reduce((sum, t) => sum + (Number(t.actual_hours) || 0), 0);
      const utilizationPercent = Math.min(150, Math.round((totalEstimated / maxWeeklyHours) * 100));

      let capacityStatus = 'Optimal';
      if (utilizationPercent > 100) capacityStatus = 'Overloaded (Burnout Risk)';
      else if (utilizationPercent < 40) capacityStatus = 'Available / Low';

      return {
        id: member.id,
        name: member.name,
        avatar_url: member.avatar_url,
        job_title: member.job_title || 'Engineer',
        active_task_count: activeTasks.length,
        total_estimated_hours: totalEstimated,
        total_logged_hours: totalLogged,
        utilization_percent: utilizationPercent,
        capacity_status: capacityStatus
      };
    });

    res.json(workloadData);
  } catch (err) {
    res.status(500).json({ message: 'Failed to calculate workload' });
  }
});

// ==============================================================================
// 18. AI-Powered Assistance (Smart Scheduling & Risk Engine)
// ==============================================================================

// @route POST /api/projects/:id/ai/breakdown-task
router.post('/:id/ai/breakdown-task', protect, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: 'Task title required' });

    const lower = title.toLowerCase();
    let suggestedSubtasks = [];

    if (lower.includes('auth') || lower.includes('login') || lower.includes('oauth') || lower.includes('register')) {
      suggestedSubtasks = [
        'Design secure JWT authentication middleware',
        'Implement input validation & sanitize payload',
        'Configure password hashing & salt with bcrypt',
        'Setup refresh token & logout session invalidation',
        'Write integration test for auth failures'
      ];
    } else if (lower.includes('api') || lower.includes('backend') || lower.includes('crud') || lower.includes('route')) {
      suggestedSubtasks = [
        'Define PostgreSQL table schema & foreign keys',
        'Create Express route handlers with error boundaries',
        'Implement Row Level Security (RLS) policies',
        'Add Swagger / OpenAPI endpoint documentation',
        'Verify query latency with EXPLAIN ANALYZE'
      ];
    } else if (lower.includes('ui') || lower.includes('design') || lower.includes('frontend') || lower.includes('page') || lower.includes('component')) {
      suggestedSubtasks = [
        'Create high-fidelity Tailwind responsive layout',
        'Implement dark/light mode CSS theme tokens',
        'Handle loading skeletons and empty states',
        'Add keyboard accessibility & ARIA attributes',
        'Test cross-browser rendering on mobile & desktop'
      ];
    } else if (lower.includes('deploy') || lower.includes('ci/cd') || lower.includes('docker') || lower.includes('pipeline')) {
      suggestedSubtasks = [
        'Configure GitHub Actions automated build pipeline',
        'Set up environment variables & secrets management',
        'Run production build optimization & asset compression',
        'Configure SSL certificate & custom domain routing',
        'Verify zero-downtime health check endpoint'
      ];
    } else if (lower.includes('database') || lower.includes('sql') || lower.includes('migration') || lower.includes('schema')) {
      suggestedSubtasks = [
        'Draft normalized relational schema with constraints',
        'Write safe idempotent SQL migration script',
        'Configure performance indexes on query paths',
        'Setup automated triggers for updated_at timestamps',
        'Test cascade delete behaviors and edge cases'
      ];
    } else {
      suggestedSubtasks = [
        `Define technical requirements for ${title}`,
        'Draft architecture implementation plan',
        'Execute core development & code review',
        'Conduct unit & regression testing',
        'Deploy to staging and verify acceptance criteria'
      ];
    }

    res.json({
      title,
      suggested_subtasks: suggestedSubtasks,
      estimated_hours: suggestedSubtasks.length * 2,
      suggested_priority: suggestedSubtasks.length > 4 ? 'High' : 'Medium'
    });
  } catch (err) {
    res.status(500).json({ message: 'AI Breakdown failed' });
  }
});

// @route POST /api/projects/:id/ai/risk-assessment
router.post('/:id/ai/risk-assessment', protect, async (req, res) => {
  try {
    const { data: project } = await supabase
      .from('projects')
      .select('*, tasks(*)')
      .eq('id', req.params.id)
      .single();

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const tasks = project.tasks || [];
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Done');
    const unassignedHighPriority = tasks.filter(t => t.priority === 'High' && !t.assigned_to && t.status !== 'Done');
    const doneTasks = tasks.filter(t => t.status === 'Done');

    let healthScore = 100;
    const risks = [];
    const recommendations = [];

    if (overdueTasks.length > 0) {
      healthScore -= overdueTasks.length * 12;
      risks.push({ severity: 'High', title: `${overdueTasks.length} Overdue Task(s)`, detail: 'Critical deliverables missed target dates.' });
      recommendations.push('Re-estimate remaining timeline and shift sprint deadline or reassign bottlenecks.');
    }

    if (unassignedHighPriority.length > 0) {
      healthScore -= unassignedHighPriority.length * 8;
      risks.push({ severity: 'Medium', title: `${unassignedHighPriority.length} Unassigned High Priority Tasks`, detail: 'Tasks on critical path without owner.' });
      recommendations.push('Assign high-priority tasks to available team members immediately.');
    }

    const completionRate = tasks.length > 0 ? (doneTasks.length / tasks.length) * 100 : 0;
    if (tasks.length > 8 && completionRate < 25) {
      healthScore -= 10;
      risks.push({ severity: 'Medium', title: 'Low Sprint Velocity', detail: 'Completion rate is trailing behind initial roadmap.' });
    }

    healthScore = Math.max(15, Math.min(100, healthScore));

    res.json({
      health_score: healthScore,
      status: healthScore >= 80 ? 'Healthy & On Track' : healthScore >= 50 ? 'Moderate Risk' : 'Critical Attention Required',
      risks,
      recommendations,
      analyzed_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: 'AI Risk Assessment failed' });
  }
});

// @route POST /api/projects/:id/ai/parse-command
router.post('/:id/ai/parse-command', protect, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt required' });

    const lower = prompt.toLowerCase();
    let actionResult = null;

    if (lower.includes('task') || lower.includes('add') || lower.includes('create')) {
      let priority = 'Medium';
      if (lower.includes('high') || lower.includes('urgent') || lower.includes('p0')) priority = 'High';
      else if (lower.includes('low')) priority = 'Low';

      const taskTitle = prompt.replace(/create|add|task|high|low|priority|due|next|friday|monday/gi, '').trim() || 'AI Generated Task';
      
      const { data: createdTask } = await supabase
        .from('tasks')
        .insert([{
          project_id: req.params.id,
          title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
          priority,
          status: 'Todo',
          assigned_to: req.user.id,
          estimated_hours: priority === 'High' ? 8 : 4
        }])
        .select()
        .single();

      actionResult = { action: 'created_task', task: createdTask, message: `Created task "${createdTask.title}" (${priority} priority)` };
    } else {
      actionResult = { action: 'info', message: `Analyzed prompt: "${prompt}". No state modification needed.` };
    }

    res.json(actionResult);
  } catch (err) {
    res.status(500).json({ message: 'AI Command parsing failed' });
  }
});

module.exports = router;
