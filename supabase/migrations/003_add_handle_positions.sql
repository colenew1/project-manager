-- Add source_handle and target_handle columns to project_relations
-- These store which handle (top, bottom, left, right) the edge connects to

ALTER TABLE public.project_relations
ADD COLUMN source_handle TEXT DEFAULT NULL,
ADD COLUMN target_handle TEXT DEFAULT NULL;
