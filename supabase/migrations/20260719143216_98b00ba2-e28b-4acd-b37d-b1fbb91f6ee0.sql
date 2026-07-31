
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email='review@barakah.services';
  IF uid IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = crypt('Barakah@123', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = uid;

    INSERT INTO public.profiles (user_id, full_name)
    VALUES (uid::text, 'Apple Review')
    ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid::text, 'normal_user')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
