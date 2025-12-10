-- Notes table for standalone notes that can be linked to projects
CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for notes <-> projects (many-to-many)
CREATE TABLE public.note_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(note_id, project_id)
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes
CREATE POLICY "Users can view their own notes"
    ON public.notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
    ON public.notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
    ON public.notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
    ON public.notes FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for note_projects
CREATE POLICY "Users can view their own note projects"
    ON public.note_projects FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.notes
        WHERE notes.id = note_projects.note_id
        AND notes.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own note projects"
    ON public.note_projects FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.notes
        WHERE notes.id = note_projects.note_id
        AND notes.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own note projects"
    ON public.note_projects FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.notes
        WHERE notes.id = note_projects.note_id
        AND notes.user_id = auth.uid()
    ));

-- Indexes for performance
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_is_pinned ON public.notes(is_pinned);
CREATE INDEX idx_note_projects_note_id ON public.note_projects(note_id);
CREATE INDEX idx_note_projects_project_id ON public.note_projects(project_id);
