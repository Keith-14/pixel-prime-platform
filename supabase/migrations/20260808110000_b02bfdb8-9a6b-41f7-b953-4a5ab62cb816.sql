CREATE OR REPLACE FUNCTION public.is_community_owner(_community_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = _community_id AND c.created_by = _user_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_community_owner(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_community_owner(uuid, uuid) TO authenticated, service_role;

CREATE POLICY "Owners can remove members"
ON public.community_members FOR DELETE TO authenticated
USING (public.is_community_owner(community_id, auth.uid()) AND role <> 'owner');

CREATE POLICY "Owners can delete any community post"
ON public.community_posts FOR DELETE TO authenticated
USING (public.is_community_owner(community_id, auth.uid()));

CREATE POLICY "Owners can delete any community comment"
ON public.community_comments FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.community_posts p
  WHERE p.id = post_id AND public.is_community_owner(p.community_id, auth.uid())
));