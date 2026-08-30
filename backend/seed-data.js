const supabase = require('./supabaseClient');

async function seedDatabase() {
  console.log('🚀 Starting Supabase Database Seeding...\n');

  try {
    // 1. Fetch valid registered users from profiles
    const { data: existingProfiles, error: profError } = await supabase
      .from('profiles')
      .select('*');

    if (profError || !existingProfiles || existingProfiles.length === 0) {
      console.error('Error fetching existing profiles:', profError?.message);
      return;
    }

    const primaryUser = existingProfiles[0];
    const secondaryUser = existingProfiles[1] || existingProfiles[0];

    const u1 = primaryUser.id;
    const u2 = secondaryUser.id;

    console.log(`Using primary user: ${primaryUser.name} (${u1})`);
    console.log(`Using secondary user: ${secondaryUser.name} (${u2})`);

    // Enrich existing user profiles with avatars & professional titles
    await supabase.from('profiles').update({
      job_title: 'Principal Software Architect',
      bio: 'Building scalable cloud architectures, high-velocity developer tools, and real-time distributed systems.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      phone: '+1 (555) 234-5678'
    }).eq('id', u1);

    if (u1 !== u2) {
      await supabase.from('profiles').update({
        job_title: 'Lead Product Designer',
        bio: 'Focused on UI design tokens, micro-interactions, and accessibility standards.',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        phone: '+1 (555) 876-5432'
      }).eq('id', u2);
    }

    console.log('✅ User profiles updated with photos and bios.');

    // 2. Create 4 realistic projects
    const projectsData = [
      {
        id: 'a1000000-0000-0000-0000-000000000001',
        title: 'CloudScale Enterprise Platform v2.0',
        description: 'Next-generation distributed cloud workspace with real-time multi-tenant collaboration, automated canary deployments, and sub-10ms query latency.',
        category: 'Development',
        priority: 'High',
        status: 'Active',
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        color: '#10b981',
        budget: 45000.00,
        tags: 'Cloud, React, PostgreSQL, High-Velocity, Sprint-4',
        owner_id: u1,
        is_public: true,
        share_token: 'cloudscale-v2-preview-token'
      },
      {
        id: 'a2000000-0000-0000-0000-000000000002',
        title: 'Aurora UI Design System & Component Library',
        description: 'Universal design token system, accessible Tailwind 4 component primitive catalog, and dark-mode micro-animations for web & mobile applications.',
        category: 'Design',
        priority: 'Medium',
        status: 'Active',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        color: '#6366f1',
        budget: 18000.00,
        tags: 'Design System, UI/UX, Tokens, Tailwind',
        owner_id: u1,
        is_public: true,
        share_token: 'aurora-design-showcase'
      },
      {
        id: 'a3000000-0000-0000-0000-000000000003',
        title: 'Enterprise SOC2 & Security Hardening',
        description: 'End-to-end security compliance audit, zero-trust RBAC permission engine, automated vulnerability scanning, and audit logging infrastructure.',
        category: 'Security',
        priority: 'High',
        status: 'Active',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        color: '#ef4444',
        budget: 25000.00,
        tags: 'Security, Compliance, SOC2, Audit',
        owner_id: u1,
        is_public: false,
        share_token: 'sec-audit-2026-token'
      },
      {
        id: 'a4000000-0000-0000-0000-000000000004',
        title: 'Q4 Product Launch & GTM Strategy',
        description: 'Comprehensive global go-to-market campaign across Product Hunt, Hacker News, organic SEO pillars, interactive demo sandbox, and conversion funnels.',
        category: 'Marketing',
        priority: 'Medium',
        status: 'Active',
        due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        color: '#f59e0b',
        budget: 15000.00,
        tags: 'GTM, Launch, Marketing, Growth',
        owner_id: u1,
        is_public: false,
        share_token: 'gtm-launch-q4-token'
      }
    ];

    for (const proj of projectsData) {
      await supabase.from('projects').upsert([proj], { onConflict: 'id' });
    }
    console.log('✅ 4 Feature-Rich Projects created.');

    const p1Id = projectsData[0].id;
    const p2Id = projectsData[1].id;
    const p3Id = projectsData[2].id;
    const p4Id = projectsData[3].id;

    // 3. Project Members
    const members = [
      { project_id: p1Id, user_id: u1, role: 'owner' },
      { project_id: p1Id, user_id: u2, role: 'admin' },
      { project_id: p2Id, user_id: u1, role: 'owner' },
      { project_id: p2Id, user_id: u2, role: 'member' },
      { project_id: p3Id, user_id: u1, role: 'owner' },
      { project_id: p3Id, user_id: u2, role: 'admin' },
      { project_id: p4Id, user_id: u1, role: 'owner' }
    ];

    await supabase.from('project_members').upsert(members, { onConflict: 'project_id,user_id' });
    console.log('✅ Project Memberships configured.');

    // 4. Tasks for Project 1 (CloudScale Enterprise Platform)
    const p1Tasks = [
      {
        id: 'b1000000-0000-0000-0000-000000000001',
        project_id: p1Id,
        title: 'Architect Real-Time WebSocket & Event Stream Pipeline',
        description: 'Implement distributed event broadcasting using Supabase Realtime channels and PostgreSQL triggers for instant sub-second synchronization.',
        status: 'Done',
        priority: 'High',
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigned_to: u1,
        tags: 'Backend, Realtime, Architecture',
        order_index: 0,
        estimated_hours: 16,
        actual_hours: 14.5,
        story_points: 5,
        recurrence: 'none'
      },
      {
        id: 'b1000000-0000-0000-0000-000000000002',
        project_id: p1Id,
        title: 'Build Dual-Mode Kanban & Sprint Gantt Schedule View',
        description: 'Create interactive drag-and-drop board view with real-time column state transitions, timeline bar rendering, and assignee filters.',
        status: 'In Progress',
        priority: 'High',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigned_to: u2,
        tags: 'Frontend, UI, Kanban',
        order_index: 1,
        estimated_hours: 20,
        actual_hours: 12.0,
        story_points: 8,
        recurrence: 'none'
      },
      {
        id: 'b1000000-0000-0000-0000-000000000003',
        project_id: p1Id,
        title: 'Automated Trigger-Action Workflow Execution Engine',
        description: 'Support configurable event triggers (all subtasks done, status change, PR merge) with immediate state progression and notifications.',
        status: 'In Progress',
        priority: 'High',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigned_to: u1,
        tags: 'Backend, Automation, Engine',
        order_index: 2,
        estimated_hours: 14,
        actual_hours: 11.5,
        story_points: 5,
        recurrence: 'none'
      },
      {
        id: 'b1000000-0000-0000-0000-000000000004',
        project_id: p1Id,
        title: 'Team Workload & Burnout Risk Heatmap Analytics',
        description: 'Aggregate weekly sprint velocity, estimated vs logged hours per developer, and highlight capacity bottlenecks.',
        status: 'Todo',
        priority: 'Medium',
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigned_to: u2,
        tags: 'Analytics, Heatmap, Metrics',
        order_index: 3,
        estimated_hours: 12,
        actual_hours: 0,
        story_points: 3,
        recurrence: 'none'
      },
      {
        id: 'b1000000-0000-0000-0000-000000000005',
        project_id: p1Id,
        title: 'Live Audio Huddle & Spatial Peer Audio Room',
        description: 'Integrated quick audio huddle with participant status indicators, mute toggles, and live presence indicator.',
        status: 'In Progress',
        priority: 'Medium',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigned_to: u2,
        tags: 'Audio, Realtime, Collaboration',
        order_index: 4,
        estimated_hours: 18,
        actual_hours: 6.5,
        story_points: 5,
        recurrence: 'none'
      },
      {
        id: 'b1000000-0000-0000-0000-000000000006',
        project_id: p1Id,
        title: 'Zero-Downtime GitHub Webhook Continuous Deployment',
        description: 'Connect automated incoming webhooks from GitHub & GitLab to advance sprint status upon PR merge.',
        status: 'Todo',
        priority: 'Low',
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigned_to: u1,
        tags: 'DevOps, CI/CD, GitHub',
        order_index: 5,
        estimated_hours: 8,
        actual_hours: 0,
        story_points: 2,
        recurrence: 'none'
      }
    ];

    for (const t of p1Tasks) {
      await supabase.from('tasks').upsert([t], { onConflict: 'id' });
    }
    console.log('✅ Tasks populated for CloudScale project.');

    // 5. Checklist Subtasks
    await supabase.from('subtasks').delete().in('task_id', [p1Tasks[0].id, p1Tasks[1].id, p1Tasks[2].id]);
    
    const subtasks = [
      { task_id: p1Tasks[0].id, title: 'Define PostgreSQL trigger functions for change capture', is_completed: true },
      { task_id: p1Tasks[0].id, title: 'Configure supabase_realtime publication on tasks & comments', is_completed: true },
      { task_id: p1Tasks[0].id, title: 'Implement reconnect retry backoff strategy in frontend', is_completed: true },
      { task_id: p1Tasks[1].id, title: 'Build Kanban column drag-and-drop dropzones', is_completed: true },
      { task_id: p1Tasks[1].id, title: 'Implement Gantt date-range bar coordinate calculations', is_completed: true },
      { task_id: p1Tasks[1].id, title: 'Add quick task creation shortcut on column headers', is_completed: false },
      { task_id: p1Tasks[1].id, title: 'Test responsive drawer modal on mobile viewport', is_completed: false },
      { task_id: p1Tasks[2].id, title: 'Create project_automations schema & RLS rules', is_completed: true },
      { task_id: p1Tasks[2].id, title: 'Implement trigger event dispatcher in Express routes', is_completed: true },
      { task_id: p1Tasks[2].id, title: 'Add in-app notification broadcast for action payloads', is_completed: true }
    ];

    const { error: stError } = await supabase.from('subtasks').insert(subtasks);
    if (stError) console.error('Subtasks error:', stError);
    else console.log('✅ Checklist subtasks created.');

    // 6. Time Logs
    await supabase.from('time_logs').delete().in('task_id', [p1Tasks[0].id, p1Tasks[1].id]);
    const timeLogs = [
      {
        task_id: p1Tasks[0].id,
        user_id: u1,
        duration_minutes: 240,
        description: 'Designed database triggers and publication channels',
        logged_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        task_id: p1Tasks[0].id,
        user_id: u1,
        duration_minutes: 180,
        description: 'Tested realtime latency and reconnection handling under simulated network drop',
        logged_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        task_id: p1Tasks[1].id,
        user_id: u2,
        duration_minutes: 360,
        description: 'Implemented Kanban column drag interactions and visual feedback states',
        logged_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        task_id: p1Tasks[1].id,
        user_id: u1,
        duration_minutes: 120,
        description: 'Live Timer: Reviewed Gantt chart math and mobile touch event handlers',
        logged_date: new Date().toISOString().split('T')[0]
      }
    ];

    const { error: tlError } = await supabase.from('time_logs').insert(timeLogs);
    if (tlError) console.warn('Time logs notice:', tlError.message);
    else console.log('✅ Time tracking logs recorded.');

    // 7. Comments
    await supabase.from('comments').delete().in('task_id', [p1Tasks[0].id, p1Tasks[1].id, p1Tasks[2].id]);
    const comments = [
      {
        task_id: p1Tasks[1].id,
        user_id: u2,
        content: 'Kanban drag and drop is now connected! Status updates persist immediately to the Supabase database with optimistic UI updates.'
      },
      {
        task_id: p1Tasks[1].id,
        user_id: u1,
        content: 'Excellent velocity! I tested the Gantt chart timeline view as well—the date calculations align smoothly with sprint deadlines.'
      },
      {
        task_id: p1Tasks[2].id,
        user_id: u2,
        content: 'The automation workflow engine looks solid. Tested moving a task to Done and it triggered the team notification immediately.'
      }
    ];

    const { error: cError } = await supabase.from('comments').insert(comments);
    if (cError) console.warn('Comments notice:', cError.message);
    else console.log('✅ Task discussion comments inserted.');

    // 8. Project Docs / Wiki
    await supabase.from('project_docs').delete().eq('project_id', p1Id);
    const docs = [
      {
        project_id: p1Id,
        user_id: u1,
        title: 'CloudScale Technical Architecture & Security Whitepaper',
        category: 'Architecture',
        content: `# CloudScale Platform Architecture\n\n### 1. High-Level System Design\nCloudScale delivers high-velocity project management with zero-latency state synchronization. \n\n- **Client Layer**: React 19, Tailwind CSS 4, Vite 8, Lucide Icons\n- **API Server**: Node.js, Express, JWT Bearer Auth Middleware, Multer Storage Streams\n- **Database**: Supabase PostgreSQL 15, Row Level Security (RLS), Realtime Publications\n- **Event Engine**: Trigger-Action Workflow Automations and Multi-Channel Webhooks\n\n### 2. Security & Access Control (RBAC)\nAll projects enforce strict Row-Level Security policies:\n1. **Owner**: Full administrative rights (invite/remove members, update budget, toggle public showcase).\n2. **Admin**: Create/edit tasks, manage specs, trigger automations.\n3. **Member**: Create tasks, log time, comment, upload attachments.\n4. **Viewer**: Read-only access to Kanban, Calendar, and Documentation.`
      },
      {
        project_id: p1Id,
        user_id: u2,
        title: 'Sprint 4 Goals & Definition of Done',
        category: 'Specifications',
        content: `# Sprint 4 Deliverables\n\n### Sprint Goals\n- Deliver real-time Kanban board with responsive dual-mode Gantt schedule.\n- Complete checklist subtasks with automatic completion triggers.\n- Launch live audio huddle room and team chat channels.\n\n### Acceptance Criteria\n- [x] RLS policies tested for multi-tenant isolation.\n- [x] Zero console errors during drag-and-drop operations.\n- [x] CSV and JSON sprint report exports validated.`
      }
    ];

    const { error: dError } = await supabase.from('project_docs').insert(docs);
    if (dError) console.warn('Docs notice:', dError.message);
    else console.log('✅ Project Wiki & Specs documentation created.');

    // 9. Automated Workflows
    await supabase.from('project_automations').delete().eq('project_id', p1Id);
    const automations = [
      {
        project_id: p1Id,
        name: 'Auto-Complete Task When All Checklist Items Done',
        trigger_event: 'all_subtasks_done',
        trigger_condition: { allCompleted: true },
        action_type: 'move_status',
        action_payload: { target_status: 'In Review' },
        is_active: true,
        execution_count: 7
      },
      {
        project_id: p1Id,
        name: 'Broadcast Alert on High Priority Tasks',
        trigger_event: 'high_priority_created',
        trigger_condition: { priority: 'High' },
        action_type: 'notify_team',
        action_payload: { message: 'High priority blocker or task created. Please review immediately.' },
        is_active: true,
        execution_count: 3
      },
      {
        project_id: p1Id,
        name: 'Auto-Advance Status on GitHub PR Merge',
        trigger_event: 'pr_merged',
        trigger_condition: { merged: true },
        action_type: 'move_status',
        action_payload: { target_status: 'Done' },
        is_active: true,
        execution_count: 12
      }
    ];

    const { error: aError } = await supabase.from('project_automations').insert(automations);
    if (aError) console.warn('Automations notice:', aError.message);
    else console.log('✅ Automated workflow rules configured.');

    // 10. Realtime Chat Messages
    await supabase.from('project_chat_messages').delete().eq('project_id', p1Id);
    const messages = [
      {
        project_id: p1Id,
        user_id: u1,
        message: 'Welcome team to the CloudScale v2.0 sprint channel! All tasks and specs are now mapped on the Kanban board.'
      },
      {
        project_id: p1Id,
        user_id: u2,
        message: 'Looks great! I am currently working on the responsive Gantt timeline and drag interactions.'
      },
      {
        project_id: p1Id,
        user_id: u1,
        message: 'CI/CD pipeline webhook is configured. Merging PRs will automatically advance corresponding sprint tasks to Done.'
      }
    ];

    const { error: mError } = await supabase.from('project_chat_messages').insert(messages);
    if (mError) console.warn('Chat notice:', mError.message);
    else console.log('✅ Real-time team chat messages sent.');

    // 11. Audio Huddle Session
    await supabase.from('huddle_sessions').upsert([{
      project_id: p1Id,
      active_participants: [
        { id: u1, name: primaryUser.name, avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', joined_at: new Date().toISOString() },
        { id: u2, name: secondaryUser.name, avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', joined_at: new Date().toISOString() }
      ],
      is_active: true,
      updated_at: new Date().toISOString()
    }], { onConflict: 'project_id' });
    console.log('✅ Live Audio Huddle session activated.');

    // 12. In-App Notifications
    await supabase.from('notifications').delete().eq('user_id', u1);
    const notifications = [
      {
        user_id: u1,
        title: 'Task Assigned',
        message: 'You were assigned to "Architect Real-Time WebSocket & Event Stream Pipeline"',
        type: 'assignment',
        link: `/projects/${p1Id}`,
        is_read: false
      },
      {
        user_id: u1,
        title: 'Automation Triggered',
        message: 'Automation "Auto-Advance Status on GitHub PR Merge" executed successfully.',
        type: 'automation',
        link: `/projects/${p1Id}`,
        is_read: false
      },
      {
        user_id: u1,
        title: 'Sprint Deadline Notice',
        message: 'Sprint 4 milestone target date is approaching in 3 weeks.',
        type: 'deadline',
        link: `/projects/${p1Id}`,
        is_read: true
      }
    ];

    const { error: nError } = await supabase.from('notifications').insert(notifications);
    if (nError) console.warn('Notifications notice:', nError.message);
    else console.log('✅ In-App notifications created.');

    // 13. Project Attachments
    await supabase.from('attachments').delete().eq('project_id', p1Id);
    const attachments = [
      {
        project_id: p1Id,
        task_id: p1Tasks[0].id,
        user_id: u1,
        file_name: 'cloudscale_system_architecture_diagram.pdf',
        file_url: 'https://ogkqigqbwpjyhsovbull.supabase.co/storage/v1/object/public/project-attachments/uploads/architecture_diagram.pdf',
        file_type: 'application/pdf',
        file_size: 2458900,
        description: 'High-level ERD and real-time event pipeline architecture.'
      },
      {
        project_id: p1Id,
        task_id: p1Tasks[1].id,
        user_id: u2,
        file_name: 'kanban_dual_mode_wireframe_spec.png',
        file_url: 'https://ogkqigqbwpjyhsovbull.supabase.co/storage/v1/object/public/project-attachments/uploads/kanban_wireframe.png',
        file_type: 'image/png',
        file_size: 1048576,
        description: 'Interactive Kanban board and Gantt schedule UI wireframes.'
      }
    ];

    const { error: atError } = await supabase.from('attachments').insert(attachments);
    if (atError) console.warn('Attachments notice:', atError.message);
    else console.log('✅ Project file attachments recorded.');

    // 14. Activity Audit Stream
    await supabase.from('activities').delete().eq('project_id', p1Id);
    const activities = [
      {
        project_id: p1Id,
        user_id: u1,
        action: 'created_project',
        details: { title: 'CloudScale Enterprise Platform v2.0', template: 'software_sprint' }
      },
      {
        project_id: p1Id,
        user_id: u1,
        action: 'created_task',
        details: { title: 'Architect Real-Time WebSocket & Event Stream Pipeline', priority: 'High' }
      },
      {
        project_id: p1Id,
        user_id: u2,
        action: 'updated_task_status',
        details: { title: 'Build Dual-Mode Kanban & Sprint Gantt Schedule View', status: 'In Progress' }
      },
      {
        project_id: p1Id,
        user_id: u1,
        action: 'logged_time',
        details: { minutes: 240, task_id: p1Tasks[0].id, description: 'Designed database triggers' }
      }
    ];

    const { error: acError } = await supabase.from('activities').insert(activities);
    if (acError) console.warn('Activity notice:', acError.message);
    else console.log('✅ Activity audit stream populated.');

    console.log('\n🎉 ALL DUMMY DATA SEEDED SUCCESSFULLY INTO SUPABASE!');
  } catch (globalErr) {
    console.error('❌ Seeding Error:', globalErr);
  }
}

seedDatabase();
