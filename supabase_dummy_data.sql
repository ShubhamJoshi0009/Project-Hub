-- ==============================================================================
-- SUPABASE DUMMY DATA SEED SCRIPT (UPDATED & COMPATIBLE)
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Ensure tasks status check constraint supports all statuses including 'In Review'
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('Todo', 'In Progress', 'In Review', 'Done'));

DO $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;

  v_p1_id UUID := 'a1000000-0000-0000-0000-000000000001'::UUID;
  v_p2_id UUID := 'a2000000-0000-0000-0000-000000000002'::UUID;
  v_p3_id UUID := 'a3000000-0000-0000-0000-000000000003'::UUID;
  v_p4_id UUID := 'a4000000-0000-0000-0000-000000000004'::UUID;

  v_t1_id UUID := 'b1000000-0000-0000-0000-000000000001'::UUID;
  v_t2_id UUID := 'b1000000-0000-0000-0000-000000000002'::UUID;
  v_t3_id UUID := 'b1000000-0000-0000-0000-000000000003'::UUID;
  v_t4_id UUID := 'b1000000-0000-0000-0000-000000000004'::UUID;
  v_t5_id UUID := 'b1000000-0000-0000-0000-000000000005'::UUID;
  v_t6_id UUID := 'b1000000-0000-0000-0000-000000000006'::UUID;
BEGIN
  -- 2. Grab existing registered user IDs
  SELECT id INTO v_user1_id FROM public.profiles ORDER BY created_at ASC LIMIT 1;
  SELECT id INTO v_user2_id FROM public.profiles ORDER BY created_at DESC LIMIT 1;

  IF v_user1_id IS NULL THEN
    v_user1_id := '4972d84c-1d6d-4468-b886-31e9f0d96e9d'::UUID;
  END IF;
  IF v_user2_id IS NULL THEN
    v_user2_id := v_user1_id;
  END IF;

  -- 3. Enrich User Profiles
  UPDATE public.profiles
  SET 
    job_title = 'Principal Software Architect',
    bio = 'Building scalable cloud architectures and high-velocity developer workflows.',
    avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone = '+1 (555) 234-5678'
  WHERE id = v_user1_id;

  IF v_user1_id <> v_user2_id THEN
    UPDATE public.profiles
    SET 
      job_title = 'Lead Product Designer',
      bio = 'Focused on UI design tokens, micro-interactions, and accessibility standards.',
      avatar_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      phone = '+1 (555) 876-5432'
    WHERE id = v_user2_id;
  END IF;

  -- 4. Upsert Projects
  INSERT INTO public.projects (id, title, description, category, priority, status, due_date, color, budget, tags, owner_id, is_public, share_token)
  VALUES
    (v_p1_id, 'CloudScale Enterprise Platform v2.0', 'Next-generation distributed cloud workspace with real-time multi-tenant collaboration, automated canary deployments, and sub-10ms query latency.', 'Development', 'High', 'Active', CURRENT_DATE + INTERVAL '21 days', '#10b981', 45000.00, 'Cloud, React, PostgreSQL, High-Velocity, Sprint-4', v_user1_id, true, 'cloudscale-v2-preview-token'),
    (v_p2_id, 'Aurora UI Design System & Component Library', 'Universal design token system, accessible Tailwind 4 component primitive catalog, and dark-mode micro-animations for web & mobile applications.', 'Design', 'Medium', 'Active', CURRENT_DATE + INTERVAL '14 days', '#6366f1', 18000.00, 'Design System, UI/UX, Tokens, Tailwind', v_user1_id, true, 'aurora-design-showcase'),
    (v_p3_id, 'Enterprise SOC2 & Security Hardening', 'End-to-end security compliance audit, zero-trust RBAC permission engine, automated vulnerability scanning, and audit logging infrastructure.', 'Security', 'High', 'Active', CURRENT_DATE + INTERVAL '30 days', '#ef4444', 25000.00, 'Security, Compliance, SOC2, Audit', v_user1_id, false, 'sec-audit-2026-token'),
    (v_p4_id, 'Q4 Product Launch & GTM Strategy', 'Comprehensive global go-to-market campaign across Product Hunt, Hacker News, organic SEO pillars, interactive demo sandbox, and conversion funnels.', 'Marketing', 'Medium', 'Active', CURRENT_DATE + INTERVAL '45 days', '#f59e0b', 15000.00, 'GTM, Launch, Marketing, Growth', v_user1_id, false, 'gtm-launch-q4-token')
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    budget = EXCLUDED.budget;

  -- 5. Upsert Project Members
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES
    (v_p1_id, v_user1_id, 'owner'),
    (v_p1_id, v_user2_id, 'admin'),
    (v_p2_id, v_user1_id, 'owner'),
    (v_p2_id, v_user2_id, 'member'),
    (v_p3_id, v_user1_id, 'owner'),
    (v_p3_id, v_user2_id, 'admin'),
    (v_p4_id, v_user1_id, 'owner')
  ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  -- 6. Upsert Tasks
  INSERT INTO public.tasks (id, project_id, title, description, status, priority, due_date, start_date, assigned_to, tags, order_index, estimated_hours, actual_hours, story_points, recurrence)
  VALUES
    (v_t1_id, v_p1_id, 'Architect Real-Time WebSocket & Event Stream Pipeline', 'Implement distributed event broadcasting using Supabase Realtime channels and PostgreSQL triggers for instant sub-second synchronization.', 'Done', 'High', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '7 days', v_user1_id, 'Backend, Realtime, Architecture', 0, 16.0, 14.5, 5, 'none'),
    (v_t2_id, v_p1_id, 'Build Dual-Mode Kanban & Sprint Gantt Schedule View', 'Create interactive drag-and-drop board view with real-time column state transitions, timeline bar rendering, and assignee filters.', 'In Progress', 'High', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE - INTERVAL '2 days', v_user2_id, 'Frontend, UI, Kanban', 1, 20.0, 12.0, 8, 'none'),
    (v_t3_id, v_p1_id, 'Automated Trigger-Action Workflow Execution Engine', 'Support configurable event triggers (all subtasks done, status change, PR merge) with immediate state progression and notifications.', 'In Review', 'High', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE - INTERVAL '1 days', v_user1_id, 'Backend, Automation, Engine', 2, 14.0, 11.5, 5, 'none'),
    (v_t4_id, v_p1_id, 'Team Workload & Burnout Risk Heatmap Analytics', 'Aggregate weekly sprint velocity, estimated vs logged hours per developer, and highlight capacity bottlenecks.', 'Todo', 'Medium', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '2 days', v_user2_id, 'Analytics, Heatmap, Metrics', 3, 12.0, 0, 3, 'none'),
    (v_t5_id, v_p1_id, 'Live Audio Huddle & Spatial Peer Audio Room', 'Integrated quick audio huddle with participant status indicators, mute toggles, and live presence indicator.', 'In Progress', 'Medium', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE - INTERVAL '1 days', v_user2_id, 'Audio, Realtime, Collaboration', 4, 18.0, 6.5, 5, 'none'),
    (v_t6_id, v_p1_id, 'Zero-Downtime GitHub Webhook Continuous Deployment', 'Connect automated incoming webhooks from GitHub & GitLab to advance sprint status upon PR merge.', 'Todo', 'Low', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '5 days', v_user1_id, 'DevOps, CI/CD, GitHub', 5, 8.0, 0, 2, 'none')
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    priority = EXCLUDED.priority,
    estimated_hours = EXCLUDED.estimated_hours,
    actual_hours = EXCLUDED.actual_hours;

  -- 7. Subtasks
  DELETE FROM public.subtasks WHERE task_id IN (v_t1_id, v_t2_id, v_t3_id);
  INSERT INTO public.subtasks (task_id, title, is_completed)
  VALUES
    (v_t1_id, 'Define PostgreSQL trigger functions for change capture', true),
    (v_t1_id, 'Configure supabase_realtime publication on tasks & comments', true),
    (v_t1_id, 'Implement reconnect retry backoff strategy in frontend', true),
    (v_t2_id, 'Build Kanban column drag-and-drop dropzones', true),
    (v_t2_id, 'Implement Gantt date-range bar coordinate calculations', true),
    (v_t2_id, 'Add quick task creation shortcut on column headers', false),
    (v_t2_id, 'Test responsive drawer modal on mobile viewport', false),
    (v_t3_id, 'Create project_automations schema & RLS rules', true),
    (v_t3_id, 'Implement trigger event dispatcher in Express routes', true),
    (v_t3_id, 'Add in-app notification broadcast for action payloads', true);

  -- 8. Time Logs
  DELETE FROM public.time_logs WHERE task_id IN (v_t1_id, v_t2_id);
  INSERT INTO public.time_logs (task_id, user_id, duration_minutes, description, logged_date)
  VALUES
    (v_t1_id, v_user1_id, 240, 'Designed database triggers and publication channels', CURRENT_DATE - INTERVAL '3 days'),
    (v_t1_id, v_user1_id, 180, 'Tested realtime latency and reconnection handling under simulated network drop', CURRENT_DATE - INTERVAL '2 days'),
    (v_t2_id, v_user2_id, 360, 'Implemented Kanban column drag interactions and visual feedback states', CURRENT_DATE - INTERVAL '1 days'),
    (v_t2_id, v_user1_id, 120, 'Live Timer: Reviewed Gantt chart math and mobile touch event handlers', CURRENT_DATE);

  -- 9. Comments
  DELETE FROM public.comments WHERE task_id IN (v_t1_id, v_t2_id, v_t3_id);
  INSERT INTO public.comments (task_id, user_id, content)
  VALUES
    (v_t2_id, v_user2_id, 'Kanban drag and drop is now connected! Status updates persist immediately to the Supabase database with optimistic UI updates.'),
    (v_t2_id, v_user1_id, 'Excellent velocity! I tested the Gantt chart timeline view as well—the date calculations align smoothly with sprint deadlines.'),
    (v_t3_id, v_user2_id, 'The automation workflow engine looks solid. Tested moving a task to Done and it triggered the team notification immediately.');

  -- 10. Project Docs
  DELETE FROM public.project_docs WHERE project_id = v_p1_id;
  INSERT INTO public.project_docs (project_id, user_id, title, category, content)
  VALUES
    (v_p1_id, v_user1_id, 'CloudScale Technical Architecture & Security Whitepaper', 'Architecture', '# CloudScale Platform Architecture\n\n### 1. High-Level System Design\nCloudScale delivers high-velocity project management with zero-latency state synchronization.\n\n- **Client Layer**: React 19, Tailwind CSS 4, Vite 8, Lucide Icons\n- **API Server**: Node.js, Express, JWT Bearer Auth Middleware, Multer Storage Streams\n- **Database**: Supabase PostgreSQL 15, Row Level Security (RLS), Realtime Publications\n- **Event Engine**: Trigger-Action Workflow Automations and Multi-Channel Webhooks'),
    (v_p1_id, v_user2_id, 'Sprint 4 Goals & Definition of Done', 'Specifications', '# Sprint 4 Deliverables\n\n### Sprint Goals\n- Deliver real-time Kanban board with responsive dual-mode Gantt schedule.\n- Complete checklist subtasks with automatic completion triggers.\n- Launch live audio huddle room and team chat channels.');

  -- 11. Automations
  DELETE FROM public.project_automations WHERE project_id = v_p1_id;
  INSERT INTO public.project_automations (project_id, name, trigger_event, trigger_condition, action_type, action_payload, is_active, execution_count)
  VALUES
    (v_p1_id, 'Auto-Complete Task When All Checklist Items Done', 'all_subtasks_done', '{"allCompleted": true}'::jsonb, 'move_status', '{"target_status": "In Review"}'::jsonb, true, 7),
    (v_p1_id, 'Broadcast Alert on High Priority Tasks', 'high_priority_created', '{"priority": "High"}'::jsonb, 'notify_team', '{"message": "High priority blocker or task created. Please review immediately."}'::jsonb, true, 3),
    (v_p1_id, 'Auto-Advance Status on GitHub PR Merge', 'pr_merged', '{"merged": true}'::jsonb, 'move_status', '{"target_status": "Done"}'::jsonb, true, 12);

  -- 12. Chat Messages
  DELETE FROM public.project_chat_messages WHERE project_id = v_p1_id;
  INSERT INTO public.project_chat_messages (project_id, user_id, message)
  VALUES
    (v_p1_id, v_user1_id, 'Welcome team to the CloudScale v2.0 sprint channel! All tasks and specs are now mapped on the Kanban board.'),
    (v_p1_id, v_user2_id, 'Looks great! I am currently working on the responsive Gantt timeline and drag interactions.'),
    (v_p1_id, v_user1_id, 'CI/CD pipeline webhook is configured. Merging PRs will automatically advance corresponding sprint tasks to Done.');

  -- 13. Audio Huddle Session
  INSERT INTO public.huddle_sessions (project_id, active_participants, is_active, updated_at)
  VALUES (
    v_p1_id,
    '[{"name": "Team Standup", "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}]'::jsonb,
    true,
    NOW()
  )
  ON CONFLICT (project_id) DO UPDATE SET
    active_participants = EXCLUDED.active_participants,
    is_active = EXCLUDED.is_active;

  -- 14. Notifications
  DELETE FROM public.notifications WHERE user_id = v_user1_id;
  INSERT INTO public.notifications (user_id, title, message, type, link, is_read)
  VALUES
    (v_user1_id, 'Task Assigned', 'You were assigned to "Architect Real-Time WebSocket & Event Stream Pipeline"', 'assignment', '/projects/' || v_p1_id::TEXT, false),
    (v_user1_id, 'Automation Triggered', 'Automation "Auto-Advance Status on GitHub PR Merge" executed successfully.', 'automation', '/projects/' || v_p1_id::TEXT, false),
    (v_user1_id, 'Sprint Milestone Notice', 'Sprint 4 target delivery date is approaching in 3 weeks.', 'deadline', '/projects/' || v_p1_id::TEXT, true);

  -- 15. Activity Log
  DELETE FROM public.activities WHERE project_id = v_p1_id;
  INSERT INTO public.activities (project_id, user_id, action, details)
  VALUES
    (v_p1_id, v_user1_id, 'created_project', '{"title": "CloudScale Enterprise Platform v2.0", "template": "software_sprint"}'::jsonb),
    (v_p1_id, v_user1_id, 'created_task', '{"title": "Architect Real-Time WebSocket & Event Stream Pipeline", "priority": "High"}'::jsonb),
    (v_p1_id, v_user2_id, 'updated_task_status', '{"title": "Build Dual-Mode Kanban & Sprint Gantt Schedule View", "status": "In Progress"}'::jsonb),
    (v_p1_id, v_user1_id, 'logged_time', '{"minutes": 240, "description": "Designed database triggers"}'::jsonb);

  RAISE NOTICE '✅ Supabase Dummy Data Seeded Successfully!';
END $$;
