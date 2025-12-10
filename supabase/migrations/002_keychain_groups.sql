-- ============================================
-- KEYCHAIN GROUPS TABLE (replaces old keychain table)
-- ============================================
CREATE TABLE public.keychain_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,                    -- e.g., "Supabase - Project Manager"
    service TEXT,                          -- e.g., "Supabase", "Stripe", "AWS"
    environment TEXT DEFAULT 'production' CHECK (environment IN ('production', 'development', 'staging')),
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_keychain_groups_user_id ON public.keychain_groups(user_id);
CREATE INDEX idx_keychain_groups_service ON public.keychain_groups(service);

-- ============================================
-- KEYCHAIN ENTRIES TABLE (key-value pairs within a group)
-- ============================================
CREATE TABLE public.keychain_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.keychain_groups(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,                   -- e.g., "SUPABASE_URL", "SUPABASE_ANON_KEY"
    value TEXT NOT NULL,                   -- The actual value
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_keychain_entries_group ON public.keychain_entries(group_id);

-- ============================================
-- KEYCHAIN GROUP PROJECTS JUNCTION TABLE
-- ============================================
CREATE TABLE public.keychain_group_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.keychain_groups(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(group_id, project_id)
);

CREATE INDEX idx_keychain_group_projects_group ON public.keychain_group_projects(group_id);
CREATE INDEX idx_keychain_group_projects_project ON public.keychain_group_projects(project_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE public.keychain_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keychain_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keychain_group_projects ENABLE ROW LEVEL SECURITY;

-- Keychain groups policies
CREATE POLICY "Users can view own keychain groups" ON public.keychain_groups
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own keychain groups" ON public.keychain_groups
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own keychain groups" ON public.keychain_groups
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own keychain groups" ON public.keychain_groups
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Keychain entries policies (based on group ownership)
CREATE POLICY "Users can manage keychain entries" ON public.keychain_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.keychain_groups
            WHERE id = group_id AND user_id = (SELECT auth.uid())
        )
    );

-- Keychain group projects policies (based on group ownership)
CREATE POLICY "Users can manage keychain group projects" ON public.keychain_group_projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.keychain_groups
            WHERE id = group_id AND user_id = (SELECT auth.uid())
        )
    );

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.keychain_groups
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
