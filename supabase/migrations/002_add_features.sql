-- ============================================
-- ADD FAVORITES AND FOLDERS FEATURES
-- ============================================

-- Add is_favorite to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Add last_accessed_at for recent projects tracking
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

-- ============================================
-- PROJECT_FOLDERS TABLE (for grouping projects)
-- ============================================
CREATE TABLE IF NOT EXISTS public.project_folders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    icon TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_project_folders_user_id ON public.project_folders(user_id);

-- Add folder_id to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.project_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_folder ON public.projects(folder_id);
CREATE INDEX IF NOT EXISTS idx_projects_favorite ON public.projects(is_favorite);
CREATE INDEX IF NOT EXISTS idx_projects_last_accessed ON public.projects(last_accessed_at);

-- ============================================
-- ROW LEVEL SECURITY FOR FOLDERS
-- ============================================

ALTER TABLE public.project_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders" ON public.project_folders
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own folders" ON public.project_folders
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own folders" ON public.project_folders
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own folders" ON public.project_folders
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Add trigger for updated_at on folders
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.project_folders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
