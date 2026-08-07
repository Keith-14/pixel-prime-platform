CREATE OR REPLACE FUNCTION public.get_public_profiles(_user_ids text[])
RETURNS TABLE(user_id text, full_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
$$;
REVOKE ALL ON FUNCTION public.get_public_profiles(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(text[]) TO anon, authenticated;