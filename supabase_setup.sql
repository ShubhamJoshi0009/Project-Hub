-- ==============================================================================
-- PROJECT MANAGEMENT PLATFORM (SUPABASE POSTGRESQL COMPLETE SETUP SCRIPT)
-- Run this complete script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Profiles Table & Safe Migrations
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  job_title TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ==============================================================================
-- 2. Projects Table & Safe Migrations
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'On Hold', 'Completed', 'Archived')),
  category TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  due_date DATE,
  color TEXT DEFAULT '#10b981',
  budget NUMERIC(12, 2),
  tags TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#10b981';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget NUMERIC(12, 2);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ==============================================================================
-- 3. Project Members Table & Roles
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.project_members (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

ALTER TABLE public.project_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE public.project_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();

-- ==============================================================================
-- 4. Tasks Table & Safe Migrations
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Todo' CHECK (status IN ('Todo', 'In Progress', 'In Review', 'Done')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  due_date DATE,
  start_date DATE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tags TEXT,
  order_index INTEGER DEFAULT 0,
  estimated_hours NUMERIC(6, 2) DEFAULT 0,
  actual_hours NUMERIC(6, 2) DEFAULT 0,
  recurrence TEXT DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
  depends_on UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  story_points INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Todo';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(6, 2) DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(6, 2) DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'none';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS depends_on UUID REFERENCES public.tasks(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS story_points INTEGER DEFAULT 1;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Safely update status check constraint to include 'In Review'
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('Todo', 'In Progress', 'In Review', 'Done'));

-- ==============================================================================
-- 5. Subtasks / Checklist Items Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subtasks ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- ==============================================================================
-- 6. Project Documentation & Wiki (Notion/Linear style)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.project_docs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_docs ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';
ALTER TABLE public.project_docs ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE public.project_docs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ==============================================================================
-- 7. Time Logs (Live Stopwatch & Manual Hours)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  description TEXT,
  logged_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS logged_date DATE DEFAULT CURRENT_DATE;

-- ==============================================================================
-- 8. In-App Notifications
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('assignment', 'mention', 'deadline', 'join', 'automation', 'info')),
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- ==============================================================================
-- 9. Automated Workflows (Trigger-Action Engine)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.project_automations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  trigger_condition JSONB DEFAULT '{}'::jsonb,
  action_type TEXT NOT NULL,
  action_payload JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_automations ADD COLUMN IF NOT EXISTS trigger_condition JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.project_automations ADD COLUMN IF NOT EXISTS action_payload JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.project_automations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.project_automations ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0;

-- ==============================================================================
-- 10. Real-Time Project Team Chat
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.project_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_chat_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- ==============================================================================
-- 11. Webhooks & Integrations
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.project_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  service TEXT NOT NULL,
  webhook_url TEXT,
  secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  events TEXT[] DEFAULT ARRAY['all'],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_webhooks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.project_webhooks ADD COLUMN IF NOT EXISTS events TEXT[] DEFAULT ARRAY['all'];

-- ==============================================================================
-- 12. Audio Huddle Sessions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.huddle_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
  active_participants JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.huddle_sessions ADD COLUMN IF NOT EXISTS active_participants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.huddle_sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- ==============================================================================
-- 13. Comments Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 14. Attachments Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS description TEXT;

-- ==============================================================================
-- 15. Project Activity Log / Audit Feed Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- ==============================================================================
-- 16. Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_share_token ON public.projects(share_token);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_project_docs_project_id ON public.project_docs(project_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON public.time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON public.time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON public.comments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_project_id ON public.attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON public.activities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_chat_messages_project_id ON public.project_chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_webhooks_project_id ON public.project_webhooks(project_id);

-- ==============================================================================
-- 17. Security Definer Helper Functions
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_is_project_member(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_project_owner(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 18. Enable Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.huddle_sessions ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 19. RLS Policies
-- ==============================================================================
DO $$ 
BEGIN
    -- Profiles Policies
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
    CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
    CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
    CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

    -- Projects Policies
    DROP POLICY IF EXISTS "Users can view projects they own or are members of or are public." ON public.projects;
    CREATE POLICY "Users can view projects they own or are members of or are public." ON public.projects FOR SELECT USING (
        owner_id = auth.uid() OR public.check_is_project_member(id) OR is_public = true
    );
    
    DROP POLICY IF EXISTS "Users can create projects." ON public.projects;
    CREATE POLICY "Users can create projects." ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);

    DROP POLICY IF EXISTS "Project owners can update their projects." ON public.projects;
    CREATE POLICY "Project owners can update their projects." ON public.projects FOR UPDATE USING (
        owner_id = auth.uid() OR public.check_is_project_member(id)
    );

    DROP POLICY IF EXISTS "Project owners can delete their projects." ON public.projects;
    CREATE POLICY "Project owners can delete their projects." ON public.projects FOR DELETE USING (
        owner_id = auth.uid()
    );

    -- Project Members Policies
    DROP POLICY IF EXISTS "Project members are viewable by project participants." ON public.project_members;
    CREATE POLICY "Project members are viewable by project participants." ON public.project_members FOR SELECT USING (
        user_id = auth.uid() OR public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );

    DROP POLICY IF EXISTS "Project owners can manage members." ON public.project_members;
    CREATE POLICY "Project owners can manage members." ON public.project_members FOR ALL USING (
        public.check_is_project_owner(project_id) OR user_id = auth.uid()
    );

    -- Tasks Policies
    DROP POLICY IF EXISTS "Users can view tasks of projects they are members of." ON public.tasks;
    CREATE POLICY "Users can view tasks of projects they are members of." ON public.tasks FOR SELECT USING (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id) OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.is_public = true)
    );

    DROP POLICY IF EXISTS "Project members can insert tasks." ON public.tasks;
    CREATE POLICY "Project members can insert tasks." ON public.tasks FOR INSERT WITH CHECK (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );

    DROP POLICY IF EXISTS "Project members can update tasks." ON public.tasks;
    CREATE POLICY "Project members can update tasks." ON public.tasks FOR UPDATE USING (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );

    DROP POLICY IF EXISTS "Project members can delete tasks." ON public.tasks;
    CREATE POLICY "Project members can delete tasks." ON public.tasks FOR DELETE USING (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );

    -- Docs Policies
    DROP POLICY IF EXISTS "View project docs" ON public.project_docs;
    CREATE POLICY "View project docs" ON public.project_docs FOR SELECT USING (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id) OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.is_public = true)
    );

    DROP POLICY IF EXISTS "Manage project docs" ON public.project_docs;
    CREATE POLICY "Manage project docs" ON public.project_docs FOR ALL USING (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );

    -- Time Logs Policies
    DROP POLICY IF EXISTS "View time logs" ON public.time_logs;
    CREATE POLICY "View time logs" ON public.time_logs FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t 
            WHERE t.id = public.time_logs.task_id 
            AND (public.check_is_project_owner(t.project_id) OR public.check_is_project_member(t.project_id))
        )
    );

    DROP POLICY IF EXISTS "Manage time logs" ON public.time_logs;
    CREATE POLICY "Manage time logs" ON public.time_logs FOR ALL USING (
        user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.tasks t 
            WHERE t.id = public.time_logs.task_id 
            AND public.check_is_project_owner(t.project_id)
        )
    );

    -- Notifications Policies
    DROP POLICY IF EXISTS "Users can view and manage their own notifications" ON public.notifications;
    CREATE POLICY "Users can view and manage their own notifications" ON public.notifications FOR ALL USING (
        user_id = auth.uid()
    );

    -- Subtasks Policies
    DROP POLICY IF EXISTS "View subtasks" ON public.subtasks;
    CREATE POLICY "View subtasks" ON public.subtasks FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t 
            WHERE t.id = public.subtasks.task_id 
            AND (public.check_is_project_owner(t.project_id) OR public.check_is_project_member(t.project_id))
        )
    );

    DROP POLICY IF EXISTS "Manage subtasks" ON public.subtasks;
    CREATE POLICY "Manage subtasks" ON public.subtasks FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.tasks t 
            WHERE t.id = public.subtasks.task_id 
            AND (public.check_is_project_owner(t.project_id) OR public.check_is_project_member(t.project_id))
        )
    );

    -- Comments Policies
    DROP POLICY IF EXISTS "View comments" ON public.comments;
    CREATE POLICY "View comments" ON public.comments FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t 
            WHERE t.id = public.comments.task_id 
            AND (public.check_is_project_owner(t.project_id) OR public.check_is_project_member(t.project_id))
        )
    );
    
    DROP POLICY IF EXISTS "Insert comments" ON public.comments;
    CREATE POLICY "Insert comments" ON public.comments FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks t 
            WHERE t.id = task_id 
            AND (public.check_is_project_owner(t.project_id) OR public.check_is_project_member(t.project_id))
        )
    );

    -- Attachments Policies
    DROP POLICY IF EXISTS "View attachments" ON public.attachments;
    CREATE POLICY "View attachments" ON public.attachments FOR SELECT USING (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );
    
    DROP POLICY IF EXISTS "Upload attachments" ON public.attachments;
    CREATE POLICY "Upload attachments" ON public.attachments FOR INSERT WITH CHECK (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );

    DROP POLICY IF EXISTS "Delete attachments" ON public.attachments;
    CREATE POLICY "Delete attachments" ON public.attachments FOR DELETE USING (
        public.check_is_project_owner(project_id) OR user_id = auth.uid()
    );

    -- Automations Policies
    DROP POLICY IF EXISTS "View project automations" ON public.project_automations;
    CREATE POLICY "View project automations" ON public.project_automations FOR SELECT USING (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );

    DROP POLICY IF EXISTS "Manage project automations" ON public.project_automations;
    CREATE POLICY "Manage project automations" ON public.project_automations FOR ALL USING (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );

    -- Chat Messages Policies
    DROP POLICY IF EXISTS "View project chat" ON public.project_chat_messages;
    CREATE POLICY "View project chat" ON public.project_chat_messages FOR SELECT USING (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );

    DROP POLICY IF EXISTS "Send project chat" ON public.project_chat_messages;
    CREATE POLICY "Send project chat" ON public.project_chat_messages FOR INSERT WITH CHECK (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );

    -- Webhooks Policies
    DROP POLICY IF EXISTS "Manage webhooks" ON public.project_webhooks;
    CREATE POLICY "Manage webhooks" ON public.project_webhooks FOR ALL USING (
        public.check_is_project_owner(project_id)
    );

    -- Huddle Sessions Policies
    DROP POLICY IF EXISTS "View and participate in huddles" ON public.huddle_sessions;
    CREATE POLICY "View and participate in huddles" ON public.huddle_sessions FOR ALL USING (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );

    -- Activities Policies
    DROP POLICY IF EXISTS "View activities" ON public.activities;
    CREATE POLICY "View activities" ON public.activities FOR SELECT USING (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );

    DROP POLICY IF EXISTS "Insert activities" ON public.activities;
    CREATE POLICY "Insert activities" ON public.activities FOR INSERT WITH CHECK (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );
END $$;

-- ==============================================================================
-- 20. Triggers: Auto Profile Sync & Timestamps
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at timestamp handler
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_project_docs_updated_at ON public.project_docs;
CREATE TRIGGER set_project_docs_updated_at BEFORE UPDATE ON public.project_docs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_huddle_sessions_updated_at ON public.huddle_sessions;
CREATE TRIGGER set_huddle_sessions_updated_at BEFORE UPDATE ON public.huddle_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 21. Supabase Storage Buckets Setup & Policies
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-attachments', 'project-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for project-attachments & avatars
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public access to project-attachments" ON storage.objects;
  CREATE POLICY "Public access to project-attachments" ON storage.objects
  FOR SELECT USING (bucket_id IN ('project-attachments', 'avatars'));

  DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
  CREATE POLICY "Authenticated users can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('project-attachments', 'avatars'));

  DROP POLICY IF EXISTS "Users can update their uploaded attachments" ON storage.objects;
  CREATE POLICY "Users can update their uploaded attachments" ON storage.objects
  FOR UPDATE USING (bucket_id IN ('project-attachments', 'avatars'));

  DROP POLICY IF EXISTS "Users can delete their uploaded attachments" ON storage.objects;
  CREATE POLICY "Users can delete their uploaded attachments" ON storage.objects
  FOR DELETE USING (bucket_id IN ('project-attachments', 'avatars'));
END $$;

-- ==============================================================================
-- 22. Realtime Publication Setup (Safe Error-Handling Block)
-- ==============================================================================
DO $$
DECLARE
  tbl_name TEXT;
  tables_to_add TEXT[] := ARRAY[
    'tasks',
    'comments',
    'activities',
    'subtasks',
    'project_docs',
    'notifications',
    'project_automations',
    'project_chat_messages',
    'huddle_sessions',
    'projects',
    'time_logs',
    'attachments'
  ];
BEGIN
  FOREACH tbl_name IN ARRAY tables_to_add
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl_name);
    EXCEPTION
      WHEN duplicate_object THEN
        -- Table already in publication, safe to ignore
        NULL;
      WHEN undefined_table THEN
        -- Table does not exist, safe to ignore
        NULL;
      WHEN OTHERS THEN
        NULL;
    END;
  END LOOP;
END $$;
