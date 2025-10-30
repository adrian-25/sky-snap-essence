-- Create a new table for face-based albums (cluster info, custom names)
CREATE TABLE IF NOT EXISTS public.face_albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),               -- album/cluster id
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cluster_id UUID NOT NULL,                                   -- identical to used cluster_id
    name TEXT,                                                  -- user-assigned or default album name
    merged_into UUID,                                           -- for tracking merges (nullable)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, cluster_id)
);

ALTER TABLE public.face_albums ENABLE ROW LEVEL SECURITY;
-- Policies: Only owners can view/modify their albums
CREATE POLICY IF NOT EXISTS "Users can view their own face albums"
ON public.face_albums FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can manage their own face albums"
ON public.face_albums FOR ALL
USING (auth.uid() = user_id);
