-- =========================================================
-- communities and community_members
-- =========================================================
CREATE TABLE public.communities (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'Public Group',
  category text,
  banner text,
  icon_url text,
  is_private boolean NOT NULL DEFAULT false,
  created_by text REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id text NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  is_online boolean NOT NULL DEFAULT false,
  UNIQUE (community_id, user_id)
);

CREATE INDEX idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX idx_community_members_user_id ON public.community_members(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT ALL ON public.communities TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_members TO authenticated;
GRANT ALL ON public.community_members TO service_role;

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view communities" ON public.communities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create communities" ON public.communities
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update own communities" ON public.communities
  FOR UPDATE TO authenticated USING (auth.uid()::text = created_by) WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Authenticated users can view community members" ON public.community_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert community members" ON public.community_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Authenticated users can update community members" ON public.community_members
  FOR UPDATE TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Authenticated users can delete own community membership" ON public.community_members
  FOR DELETE TO authenticated USING (auth.uid()::text = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_members;

-- Seed static community records used by the app UI
INSERT INTO public.communities(id, name, description, type, category, banner, icon_url, is_private, created_by)
VALUES
  ('quran-meanings', 'Quran Meanings', 'A curated space for discussions on contemporary faith, art, and reflection.', 'Private Group', 'ummah', 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=900&h=560&fit=crop', null, true, null),
  ('sacred-journeys', 'Sacred Journeys', 'Stories, tips, and reflections from pilgrims around the world.', 'Public Group', 'heritage', 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=900&h=560&fit=crop', null, false, null),
  ('quranic-journaling-1', 'Quranic Journaling', 'Daily reflections on ayat.', 'Private Group', 'ummah', 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=900&h=560&fit=crop', null, true, null),
  ('halal-living', 'Halal Living', 'Tips for a halal lifestyle.', 'Public Group', 'lifestyle', 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=900&h=560&fit=crop', null, false, null),
  ('islamic-heritage', 'Islamic Heritage', 'Art, architecture, and history.', 'Public Group', 'heritage', 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=900&h=560&fit=crop', null, false, null),
  ('youth-ummah', 'Youth Ummah', 'A space for young Muslims.', 'Public Group', 'ummah', 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=900&h=560&fit=crop', null, false, null)
ON CONFLICT DO NOTHING;
