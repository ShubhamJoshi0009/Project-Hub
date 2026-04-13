-- 1. Create tables only if they don't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'On Hold', 'Completed')),
  category TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  due_date DATE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_members (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'Todo' CHECK (status IN ('Todo', 'In Progress', 'Done')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- 3. Create Security Definer Functions to break recursion
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

-- 4. Create policies safely
DO $$ 
BEGIN
    -- Profiles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone.') THEN
        CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile.') THEN
        CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile.') THEN
        CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- Projects
    DROP POLICY IF EXISTS "Users can view projects they own or are members of." ON public.projects;
    CREATE POLICY "Users can view projects they own or are members of." ON public.projects FOR SELECT USING (
        owner_id = auth.uid() OR public.check_is_project_member(id)
    );
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create projects.') THEN
        CREATE POLICY "Users can create projects." ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
    END IF;

    -- Project Members
    DROP POLICY IF EXISTS "Project members are viewable by project participants." ON public.project_members;
    CREATE POLICY "Project members are viewable by project participants." ON public.project_members FOR SELECT USING (
        user_id = auth.uid() OR public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );

    -- Tasks
    DROP POLICY IF EXISTS "Users can view tasks of projects they are members of." ON public.tasks;
    CREATE POLICY "Users can view tasks of projects they are members of." ON public.tasks FOR SELECT USING (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );

    -- Comments
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

    -- Attachments
    DROP POLICY IF EXISTS "View attachments" ON public.attachments;
    CREATE POLICY "View attachments" ON public.attachments FOR SELECT USING (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );
    
    DROP POLICY IF EXISTS "Upload attachments" ON public.attachments;
    CREATE POLICY "Upload attachments" ON public.attachments FOR INSERT WITH CHECK (
        public.check_is_project_owner(project_id) OR public.check_is_project_member(project_id)
    );
END $$;
