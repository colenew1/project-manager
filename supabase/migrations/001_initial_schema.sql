-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    default_mac_path TEXT DEFAULT '~/Projects',
    default_pc_path TEXT DEFAULT 'C:\Projects',
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TYPE project_status AS ENUM ('idea', 'active', 'paused', 'completed', 'archived');

CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    notes_url TEXT,
    mac_path TEXT,
    pc_path TEXT,
    github_url TEXT,
    status project_status DEFAULT 'idea' NOT NULL,
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    color TEXT DEFAULT '#6366f1',
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);

-- ============================================
-- TAGS TABLE
-- ============================================
CREATE TABLE public.tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    is_tech_stack BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, name)
);

CREATE INDEX idx_tags_user_id ON public.tags(user_id);

-- ============================================
-- PROJECT_TAGS JUNCTION TABLE
-- ============================================
CREATE TABLE public.project_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(project_id, tag_id)
);

CREATE INDEX idx_project_tags_project ON public.project_tags(project_id);
CREATE INDEX idx_project_tags_tag ON public.project_tags(tag_id);

-- ============================================
-- PROJECT_RELATIONS TABLE (for visual map)
-- ============================================
CREATE TYPE relation_type AS ENUM ('depends_on', 'related_to', 'extends', 'uses');

CREATE TABLE public.project_relations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    source_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    target_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    relation_type relation_type DEFAULT 'related_to' NOT NULL,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT different_projects CHECK (source_id != target_id),
    UNIQUE(source_id, target_id)
);

CREATE INDEX idx_relations_source ON public.project_relations(source_id);
CREATE INDEX idx_relations_target ON public.project_relations(target_id);

-- ============================================
-- TODOS TABLE
-- ============================================
CREATE TYPE todo_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE public.todos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    priority todo_priority DEFAULT 'medium' NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    recurrence_rule TEXT,
    parent_id UUID REFERENCES public.todos(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_todos_user_id ON public.todos(user_id);
CREATE INDEX idx_todos_due_date ON public.todos(due_date);
CREATE INDEX idx_todos_is_completed ON public.todos(is_completed);

-- ============================================
-- TODO_PROJECTS JUNCTION TABLE (many-to-many)
-- ============================================
CREATE TABLE public.todo_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    todo_id UUID REFERENCES public.todos(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(todo_id, project_id)
);

CREATE INDEX idx_todo_projects_todo ON public.todo_projects(todo_id);
CREATE INDEX idx_todo_projects_project ON public.todo_projects(project_id);

-- ============================================
-- SNIPPETS TABLE
-- ============================================
CREATE TABLE public.snippets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_snippets_user_id ON public.snippets(user_id);
CREATE INDEX idx_snippets_project_id ON public.snippets(project_id);
CREATE INDEX idx_snippets_language ON public.snippets(language);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING ((SELECT auth.uid()) = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Tags policies
CREATE POLICY "Users can view own tags" ON public.tags
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own tags" ON public.tags
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own tags" ON public.tags
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own tags" ON public.tags
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Project_tags policies
CREATE POLICY "Users can manage project tags" ON public.project_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = project_id AND user_id = (SELECT auth.uid())
        )
    );

-- Project_relations policies
CREATE POLICY "Users can manage project relations" ON public.project_relations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = source_id AND user_id = (SELECT auth.uid())
        )
    );

-- Todos policies
CREATE POLICY "Users can view own todos" ON public.todos
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own todos" ON public.todos
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own todos" ON public.todos
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own todos" ON public.todos
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Todo_projects policies
CREATE POLICY "Users can manage todo projects" ON public.todo_projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.todos
            WHERE id = todo_id AND user_id = (SELECT auth.uid())
        )
    );

-- Snippets policies
CREATE POLICY "Users can view own snippets" ON public.snippets
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own snippets" ON public.snippets
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own snippets" ON public.snippets
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own snippets" ON public.snippets
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.todos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.snippets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
