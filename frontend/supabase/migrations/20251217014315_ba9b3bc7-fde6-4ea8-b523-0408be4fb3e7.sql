-- Add admin role to user natan@gmail.com (only if user exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = '6a9ff562-0e22-48f0-9e99-26bcc891c6ef') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES ('6a9ff562-0e22-48f0-9e99-26bcc891c6ef', 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.profiles
    SET tipo = 'admin'
    WHERE id = '6a9ff562-0e22-48f0-9e99-26bcc891c6ef';
  END IF;
END $$;
