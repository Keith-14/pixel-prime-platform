REVOKE ALL ON FUNCTION public.community_members_count_sync() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.community_posts_count_sync() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.community_comments_count_sync() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.post_likes_count_sync() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.community_add_owner_member() FROM PUBLIC, anon, authenticated;